// Epic 007: 部署基础设施 - 性能监控API
// Task 007-05-02: 配置错误监控

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

interface PerformanceMetrics {
  page: string;
  loadTime: number;
  ttfb?: number;
  fcp?: number;
  lcp?: number;
  cls?: number;
  timestamp: string;
  userAgent: string;
}

export async function POST(request: NextRequest) {
  try {
    const metrics: PerformanceMetrics = await request.json();

    if (!metrics.page || !metrics.loadTime) {
      return NextResponse.json(
        { error: 'Page and loadTime are required' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 获取当前用户（如果已登录）
    const { data: { user } } = await supabase.auth.getUser();

    // 准备性能日志数据
    const performanceLog = {
      page_path: metrics.page,
      load_time: Math.round(metrics.loadTime),
      ttfb: metrics.ttfb ? Math.round(metrics.ttfb) : null,
      fcp: metrics.fcp ? Math.round(metrics.fcp) : null,
      lcp: metrics.lcp ? Math.round(metrics.lcp) : null,
      cls: metrics.cls || null,
      user_agent: metrics.userAgent || request.headers.get('user-agent') || 'unknown',
      user_id: user?.id || null,
      created_at: metrics.timestamp || new Date().toISOString(),
    };

    // 插入性能日志
    const { error: insertError } = await supabase
      .from('performance_logs')
      .insert([performanceLog]);

    if (insertError) {
      console.error('Failed to insert performance log:', insertError);
      
      // 如果数据库插入失败，记录到控制台
      console.log('Performance metrics that failed to insert:', performanceLog);
      
      return NextResponse.json(
        { error: 'Failed to log performance metrics' },
        { status: 500 }
      );
    }

    console.log(`Performance metrics logged for page: ${metrics.page}`);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in log-performance API:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // 管理员查看性能数据的接口
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
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const page = url.searchParams.get('page');
    const hours = parseInt(url.searchParams.get('hours') || '24');

    // 计算时间范围
    const since = new Date();
    since.setHours(since.getHours() - hours);

    let query = supabase
      .from('performance_logs')
      .select('*')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 如果指定了页面，添加过滤条件
    if (page) {
      query = query.eq('page_path', page);
    }

    const { data: performanceLogs, error } = await query;

    if (error) {
      console.error('Failed to fetch performance logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch performance logs' },
        { status: 500 }
      );
    }

    // 计算基础统计信息
    const stats = {
      totalRequests: performanceLogs.length,
      averageLoadTime: performanceLogs.length > 0 
        ? Math.round(performanceLogs.reduce((sum, log) => sum + log.load_time, 0) / performanceLogs.length)
        : 0,
      averageTTFB: performanceLogs.filter(log => log.ttfb).length > 0
        ? Math.round(performanceLogs.filter(log => log.ttfb).reduce((sum, log) => sum + log.ttfb!, 0) / performanceLogs.filter(log => log.ttfb).length)
        : 0,
      averageFCP: performanceLogs.filter(log => log.fcp).length > 0
        ? Math.round(performanceLogs.filter(log => log.fcp).reduce((sum, log) => sum + log.fcp!, 0) / performanceLogs.filter(log => log.fcp).length)
        : 0,
      averageLCP: performanceLogs.filter(log => log.lcp).length > 0
        ? Math.round(performanceLogs.filter(log => log.lcp).reduce((sum, log) => sum + log.lcp!, 0) / performanceLogs.filter(log => log.lcp).length)
        : 0,
    };

    return NextResponse.json({
      logs: performanceLogs,
      stats,
      timeRange: `${hours} hours`,
      count: performanceLogs.length,
      hasMore: performanceLogs.length === limit
    });

  } catch (error) {
    console.error('Error in GET log-performance API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}