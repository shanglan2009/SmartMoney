import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel 会自动处理输出配置
  // 确保 API 路由可以解析
  serverExternalPackages: [],
};

export default nextConfig;
