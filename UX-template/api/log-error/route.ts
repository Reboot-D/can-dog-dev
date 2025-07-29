// Epic 007: 部署基础设施 - 错误日志API
// Task 007-05-02: 配置错误监控

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

interface ErrorLog {
  message: string;
  stack?: string;
  context?: Record<string, any>;
  timestamp: string;
  userAgent: string;
  url: string;
  userId?: string;
}

interface ErrorBatch {
  errors: ErrorLog[];
  batchId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 支持单个错误和批量错误
    const errors: ErrorLog[] = body.errors || [body];
    const batchId = body.batchId || Date.now().toString();

    if (!errors || errors.length === 0) {
      return NextResponse.json(
        { error: 'No errors provided' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 获取当前用户（如果已登录）
    const { data: { user } } = await supabase.auth.getUser();

    // 准备错误日志数据
    const errorLogs = errors.map(error => ({
      message: error.message || 'Unknown error',
      stack: error.stack,
      context: error.context || {},
      user_agent: error.userAgent || request.headers.get('user-agent') || 'unknown',
      url: error.url || request.headers.get('referer') || 'unknown',
      user_id: user?.id || null,
      batch_id: batchId,
      created_at: error.timestamp || new Date().toISOString(),
    }));

    // 批量插入错误日志
    const { error: insertError } = await supabase
      .from('error_logs')
      .insert(errorLogs);

    if (insertError) {
      console.error('Failed to insert error logs:', insertError);
      
      // 如果数据库插入失败，至少记录到控制台
      console.error('Error logs that failed to insert:', errorLogs);
      
      return NextResponse.json(
        { error: 'Failed to log errors' },
        { status: 500 }
      );
    }

    console.log(`Successfully logged ${errors.length} error(s) with batch ID: ${batchId}`);

    return NextResponse.json({ 
      success: true, 
      logged: errors.length,
      batchId 
    });

  } catch (error) {
    console.error('Error in log-error API:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // 管理员查看错误日志的接口
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    // 验证用户权限
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 检查是否为管理员
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // 获取查询参数
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const severity = url.searchParams.get('severity');

    let query = supabase
      .from('error_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 如果指定了严重程度，添加过滤条件
    if (severity) {
      query = query.ilike('message', `%${severity}%`);
    }

    const { data: errorLogs, error } = await query;

    if (error) {
      console.error('Failed to fetch error logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch error logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      errors: errorLogs,
      count: errorLogs.length,
      hasMore: errorLogs.length === limit
    });

  } catch (error) {
    console.error('Error in GET log-error API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}