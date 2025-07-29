// Epic 007: 部署基础设施 - 健康检查API
// Task 007-05-03: 设置Supabase监控

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      responseTime: number;
      error?: string;
    };
    auth: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      responseTime: number;
      error?: string;
    };
    ai: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      responseTime: number;
      error?: string;
    };
    email: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      responseTime: number;
      error?: string;
    };
  };
  uptime: number;
  version: string;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    // 检查数据库连接
    const databaseStart = Date.now();
    let databaseStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let databaseError: string | undefined;
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);
      
      if (error) {
        databaseStatus = 'unhealthy';
        databaseError = error.message;
      }
    } catch (error) {
      databaseStatus = 'unhealthy';
      databaseError = error instanceof Error ? error.message : 'Unknown database error';
    }
    
    const databaseResponseTime = Date.now() - databaseStart;
    
    // 检查认证服务
    const authStart = Date.now();
    let authStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let authError: string | undefined;
    
    try {
      const { error } = await supabase.auth.getUser();
      // 这里不会报错，因为即使没有token也会返回null用户
      if (error) {
        authStatus = 'degraded';
        authError = error.message;
      }
    } catch (error) {
      authStatus = 'unhealthy';
      authError = error instanceof Error ? error.message : 'Unknown auth error';
    }
    
    const authResponseTime = Date.now() - authStart;
    
    // 检查AI服务 (Gemini API)
    const aiStart = Date.now();
    let aiStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let aiError: string | undefined;
    
    try {
      // 简单的AI服务可用性检查
      if (!process.env.GEMINI_API_KEY) {
        aiStatus = 'unhealthy';
        aiError = 'Gemini API key not configured';
      } else {
        // 可以添加实际的API调用来测试，但这里只检查配置
        aiStatus = 'healthy';
      }
    } catch (error) {
      aiStatus = 'unhealthy';
      aiError = error instanceof Error ? error.message : 'Unknown AI service error';
    }
    
    const aiResponseTime = Date.now() - aiStart;
    
    // 检查邮件服务 (Resend)
    const emailStart = Date.now();
    let emailStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let emailError: string | undefined;
    
    try {
      if (!process.env.RESEND_API_KEY) {
        emailStatus = 'unhealthy';
        emailError = 'Resend API key not configured';
      } else {
        // 可以添加实际的邮件服务检查，但这里只检查配置
        emailStatus = 'healthy';
      }
    } catch (error) {
      emailStatus = 'unhealthy';
      emailError = error instanceof Error ? error.message : 'Unknown email service error';
    }
    
    const emailResponseTime = Date.now() - emailStart;
    
    // 计算总体状态
    const services = [databaseStatus, authStatus, aiStatus, emailStatus];
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    
    if (services.includes('unhealthy')) {
      overallStatus = 'unhealthy';
    } else if (services.includes('degraded')) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }
    
    // 计算uptime (简单实现，实际中应该从服务启动时间计算)
    const uptime = process.uptime ? process.uptime() : 0;
    
    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: databaseStatus,
          responseTime: databaseResponseTime,
          error: databaseError,
        },
        auth: {
          status: authStatus,
          responseTime: authResponseTime,
          error: authError,
        },
        ai: {
          status: aiStatus,
          responseTime: aiResponseTime,
          error: aiError,
        },
        email: {
          status: emailStatus,
          responseTime: emailResponseTime,
          error: emailError,
        },
      },
      uptime,
      version: process.env.npm_package_version || '1.0.0',
    };
    
    // 记录健康检查结果到数据库
    try {
      await supabase
        .from('system_health_checks')
        .insert([
          {
            check_type: 'database',
            service_name: 'supabase',
            status: databaseStatus,
            response_time: databaseResponseTime,
            error_message: databaseError,
            metadata: { endpoint: 'user_profiles' }
          },
          {
            check_type: 'auth',
            service_name: 'supabase-auth',
            status: authStatus,
            response_time: authResponseTime,
            error_message: authError,
            metadata: {}
          },
          {
            check_type: 'external_service',
            service_name: 'gemini-api',
            status: aiStatus,
            response_time: aiResponseTime,
            error_message: aiError,
            metadata: { configured: !!process.env.GEMINI_API_KEY }
          },
          {
            check_type: 'external_service',
            service_name: 'resend',
            status: emailStatus,
            response_time: emailResponseTime,
            error_message: emailError,
            metadata: { configured: !!process.env.RESEND_API_KEY }
          }
        ]);
    } catch (error) {
      console.warn('Failed to log health check results:', error);
    }
    
    const totalResponseTime = Date.now() - startTime;
    
    // 根据状态返回适当的HTTP状态码
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;
    
    return NextResponse.json(healthStatus, { 
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': totalResponseTime.toString(),
      }
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      uptime: process.uptime ? process.uptime() : 0,
      version: process.env.npm_package_version || '1.0.0',
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
  }
}

// 简化的健康检查端点，只返回基本状态
export async function HEAD(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    // 快速数据库检查
    const { error } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      return new NextResponse(null, { status: 503 });
    }
    
    return new NextResponse(null, { status: 200 });
    
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}