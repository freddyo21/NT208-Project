export default function SuspenseFullpage() {
    return (
        <div
            className={`h-screen w-screen flex justify-center items-center bg-[#f0f2f5] gap-3`}>
            
            <span className="loading loading-spinner loading-md"></span>
            
            <h2 className="text-lg">Đang kết nối dữ liệu...</h2>
        </div>
    );
}