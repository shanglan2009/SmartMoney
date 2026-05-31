export default function TrumpLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-amber-600 border-r-transparent" />
        <p className="mt-4 text-sm text-muted">加载政要持仓数据...</p>
      </div>
    </div>
  );
}
