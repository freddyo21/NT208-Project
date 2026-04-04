import "./Login.css";
import { FormEvent, useRef, useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useToast } from "@/hooks/useToast";
import { ROUTES } from "@/routes/routes.constants";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); // Thêm state loading
    const [shake, setShake] = useState(false); // State để điều khiển rung nút

    // === BAN BY TIME: CẦN LƯU THỜI GIAN PHẠT (DEADLINE) VÀO localStorage ===
    const LOCK_STORAGE_KEY = "loginLock";
    /**
     * Cấu trúc lưu:
     * localStorage['loginLock'] = JSON.stringify({
     *   countLoginAttempts: number,
     *   lockUntil: number | null // timestamp in milliseconds, nếu không bị lock thì là null hoặc 0
     * })
     */

    const [lockTimer, setLockTimer] = useState<number>(0);
    // State hiển thị UI (tách biệt để không trigger effect worker liên tục nếu không cần thiết)
    const [showLockTimer, setShowLockTimer] = useState(false);

    // Load info lần đầu khi mount
    const [countLoginAttempts, setCountLoginAttempts] = useState(() => {
        const lockDataRaw = localStorage.getItem(LOCK_STORAGE_KEY);
        if (!lockDataRaw) return 0;
        try {
            const lockData = JSON.parse(lockDataRaw);
            return lockData.countLoginAttempts || 0;
        } catch {
            return 0;
        }
    });

    const lockWorkerRef = useRef<Worker | null>(null);

    const { loginEmail } = useFirebaseAuth();
    const navigate = useNavigate();
    const buttonRef = useRef<HTMLButtonElement>(null);

    const { toastClear, toastError, toastInfo, toastSuccess } = useToast();


    // Hàm xác định thời gian khoá dựa vào số lần thử
    function getLockSecondsByAttempts(attempts: number): number {
        if (attempts <= 5) return 0; // Cho phép sai 5 lần, lần thứ 6 trở đi mới khoá
        if (attempts <= 10) return 30; // Từ lần thứ 6 đến lần thứ 10 thì khóa 30 giây
        const lock = 60 * Math.pow(2, attempts - 11); // Lần thứ 11 thì khóa 60 giây, nhân 2 mỗi lần sai quá lần thứ 11
        const maxLock = 60 * 60; // 3600 seconds = 60 phút
        return Math.min(lock, maxLock);
    }

    // Khi mount, kiểm tra lock localStorage theo timestamp, nếu hết thì reset.
    useEffect(() => {
        const lockDataRaw = localStorage.getItem(LOCK_STORAGE_KEY);
        if (lockDataRaw) {
            try {
                const lockData = JSON.parse(lockDataRaw);
                const now = Date.now();
                // Nếu có thời hạn khoá và thời hạn này đã qua, reset ALL
                if (lockData.lockUntil && lockData.lockUntil > 0) {
                    if (now < lockData.lockUntil) {
                        // Tính thời gian còn lại
                        const secsRemain = Math.max(Math.ceil((lockData.lockUntil - now) / 1000), 0);
                        setLockTimer(secsRemain);
                    } else {
                        // Đã qua thời hạn khoá => unlock + reset số lần, dọn storage
                        // setLockTimer(0);
                        // setCountLoginAttempts(0);
                        // localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify({
                        //     countLoginAttempts: 0,
                        //     lockUntil: null
                        // }));
                    }
                } else {
                    setLockTimer(0);
                }
            } catch {
                setLockTimer(0);
            }
        } else {
            setLockTimer(0);
        }
    }, []); // chỉ chạy lần đầu

    // Worker đếm ngược cho lockTimer
    useEffect(() => {
        // Chỉ khởi tạo worker nếu đang cần lock VÀ chưa có worker nào đang chạy
        if (lockTimer > 0 && !lockWorkerRef.current) {
            setShowLockTimer(true);

            // Tạo Blob Worker
            const blob = new Blob([`
                let timer = 0;
                let interval = null;
                self.onmessage = function(e) {
                    if (e.data.action === 'START') {
                        timer = e.data.seconds;
                        if (interval) clearInterval(interval);
                        interval = setInterval(() => {
                            timer--;
                            self.postMessage({ timer }); // Gửi thời gian về main thread
                            if (timer <= 0) {
                                clearInterval(interval);
                                self.postMessage({ timer: 0, done: true });
                            }
                        }, 1000);
                    } else if (e.data.action === 'STOP') {
                        if (interval) clearInterval(interval);
                    }
                }
            `], { type: "application/javascript" });

            const workerUrl = URL.createObjectURL(blob);
            const worker = new Worker(workerUrl);
            lockWorkerRef.current = worker;

            // Gửi lệnh START
            worker.postMessage({ action: 'START', seconds: lockTimer });

            worker.onmessage = (evt) => {
                const { timer, done } = evt.data;
                // Cập nhật state đếm ngược để hiển thị UI
                setLockTimer(timer);

                if (done) {
                    setShowLockTimer(false);
                    // Dọn dẹp worker
                    worker.terminate();
                    lockWorkerRef.current = null;
                    URL.revokeObjectURL(workerUrl); // Giải phóng bộ nhớ Blob

                    // Reset biến đếm sau khi hết thời gian phạt
                    // setCountLoginAttempts(0);
                    // localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify({
                    //     countLoginAttempts: 0,
                    //     lockUntil: null
                    // }));
                }
            };
        }

        // Cleanup function chỉ chạy khi component unmount
        return () => {
            // Không terminate worker ở đây nếu lockTimer thay đổi
            // Chỉ terminate khi component unmount hẳn
        };
    }, [lockTimer]); // Dependency lockTimer là đúng, nhưng logic bên trong check !lockWorkerRef.current chặn việc tạo lại

    const toggleRememberMe = () => {
        setRememberMe((prev) => !prev);
    };

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500); // Animation 0.5s rồi tắt rung
    };

    // Hàm helper: Xử lý logic khi đăng nhập thành công
    const handleLoginSuccess = (toast: any) => {
        setCountLoginAttempts(0);
        setLockTimer(0);

        localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify({
            countLoginAttempts: 0,
            lockUntil: null
        }));

        // Nếu worker đang chạy thì kill luôn
        if (lockWorkerRef.current) {
            lockWorkerRef.current.terminate();
            lockWorkerRef.current = null;
        }

        navigate(ROUTES.DASHBOARD);
        toastClear(toast);
        toastSuccess("Thành công", "Đăng nhập thành công.");
    };

    // Hàm helper: Xử lý logic khi bị khóa do "too many requests"
    const handleTooManyRequests = (
        errorMessage: string,
        lockSeconds: number,
        nextAttempts: number
    ) => {
        let waitSeconds = 60;
        // Thử parse từ message, nếu không được thì lấy max của (local lock, 60s)
        const match = errorMessage.match(/(\d+)/);
        if (match && match[1]) waitSeconds = parseInt(match[1]);

        // Set thời gian khoá: Lấy cái nào dài hơn giữa Local và Server
        const finalLockTime = Math.max(waitSeconds, lockSeconds > 0 ? lockSeconds : 60);
        const lockUntil = Date.now() + finalLockTime * 1000;
        setLockTimer(finalLockTime);

        // Lưu cả attempts lẫn deadline
        localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify({
            countLoginAttempts: nextAttempts,
            lockUntil
        }));

        toastError("Tạm khoá", `Quá nhiều yêu cầu. Vui lòng chờ ${finalLockTime} giây.`);
    };

    // Hàm helper: Xử lý logic khóa local khi quá số lần cho phép
    const handleLocalLock = (lockSeconds: number, nextAttempts: number) => {
        const lockUntil = Date.now() + lockSeconds * 1000;
        setLockTimer(lockSeconds);

        localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify({
            countLoginAttempts: nextAttempts,
            lockUntil
        }));

        toastError("Tạm khoá", `Bạn đã đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ${lockSeconds} giây.`);
    };

    // Hàm helper: Xử lý lỗi thông thường khi login
    const handleLoginNormalError = (errorCode: string, nextAttempts: number) => {
        // Nếu chưa tới ngưỡng phạt, chỉ lưu lại số lần sai và không đặt lockUntil
        localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify({
            countLoginAttempts: nextAttempts,
            lockUntil: null
        }));

        // Kiểm tra nếu user bị cấm (ban)
        if (errorCode === "permission-denied") {
            navigate(ROUTES.BANNED);
            return;
        }

        if (
            errorCode === "auth/invalid-credential" ||
            errorCode === "auth/wrong-password" ||
            errorCode === "auth/user-not-found"
        ) {
            toastError("Lỗi", "Email hoặc mật khẩu không chính xác");
        } else if (errorCode === "auth/email-not-verified") {
            toastError("Đã gửi email", "Tài khoản chưa kích hoạt. Vui lòng kiểm tra hộp thư để xác thực email.")
        } else {
            toastError("Lỗi", "Đã xảy ra lỗi, vui lòng thử lại.");
        }
    };

    // Hàm helper: log error Firebase ra console
    const logFirebaseError = (error: any) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.group("🔥 Firebase Error");
        console.error("Code:", errorCode);
        console.error("Message:", errorMessage);
        console.error("Stack:", error.stack);
        console.groupEnd();
    };

    // Hàm chính handleLogin đã tách chức năng
    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();

        // Chặn ngay từ client nếu đang đếm ngược
        if (lockTimer > 0) {
            toastError("Đang bị khoá", `Vui lòng chờ ${lockTimer} giây.`);
            return;
        }

        setIsSubmitting(true);
        let toast: any;
        try {
            toast = toastInfo("Thông báo", "Đang đăng nhập...");
            await loginEmail(email, password, rememberMe);

            handleLoginSuccess(toast);
        } catch (error: any) {
            triggerShake();

            // 1. Tăng số lần sai
            const nextAttempts = countLoginAttempts + 1;
            setCountLoginAttempts(nextAttempts);

            // 2. Log firebase error cho dev xem
            logFirebaseError(error);

            // 3. Phân loại error
            const errorCode = error.code;
            const errorMessage = error.message;

            // Kiểm tra logic khoá cục bộ
            const lockSeconds = getLockSecondsByAttempts(nextAttempts);

            if (errorCode === "auth/too-many-requests") {
                handleTooManyRequests(errorMessage, lockSeconds, nextAttempts);
            } else if (lockSeconds > 0) {
                handleLocalLock(lockSeconds, nextAttempts);
            } else {
                handleLoginNormalError(errorCode, nextAttempts);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100 text-center">
                Đăng nhập
            </h2>
            <form className="flex flex-col gap-4 max-w-sm mx-auto mt-4"
                onSubmit={handleLogin}>
                <div>
                    <label htmlFor="email" className="block mb-1 font-medium text-gray-800 dark:text-gray-100">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        className={`w-full px-3 py-2 border border-gray-600 dark:border-gray-300 rounded-md focus:outline-none 
                            focus:ring-2 focus:ring-blue-500
                            ${isSubmitting || lockTimer > 0 ? 'cursor-not-allowed' : ''}`}
                        placeholder="Nhập email"
                        disabled={isSubmitting || lockTimer > 0}
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="password" className="block mb-1 font-medium text-gray-800 dark:text-gray-100">
                        Mật khẩu
                    </label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        className={`w-full px-3 py-2 border border-gray-600 dark:border-gray-300 rounded-md focus:outline-none 
                            focus:ring-2 focus:ring-blue-500
                            ${isSubmitting || lockTimer > 0 ? 'cursor-not-allowed' : ''}`}
                        placeholder="Nhập mật khẩu"
                        disabled={isSubmitting || lockTimer > 0}
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="rememberMe"
                        className={`cursor-pointer w-4 h-4 checkbox checkbox-primary
                            ${isSubmitting || lockTimer > 0 ? 'cursor-not-allowed' : ''}`}
                        checked={rememberMe}
                        onChange={toggleRememberMe}
                        disabled={isSubmitting || lockTimer > 0}
                    /> &nbsp;
                    <label htmlFor="rememberMe" className={`cursor-pointer select-none text-sm`}>
                        Lưu thông tin đăng nhập
                    </label>
                </div>
                {showLockTimer && lockTimer > 0 && (
                    <div className="text-center text-red-600 text-sm font-semibold mb-[-10px]">
                        Vui lòng đợi {lockTimer} giây trước khi thử lại
                    </div>
                )}
                <button
                    type="submit"
                    ref={buttonRef}
                    className={`w-full py-2 font-semibold rounded-md transition-all text-white cursor-pointer
                        ${(isSubmitting || lockTimer > 0) ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}
                        ${shake ? "shake" : ""}`}
                    disabled={isSubmitting || lockTimer > 0}
                >
                    {isSubmitting
                        ? "Đang xử lý..."
                        : (lockTimer > 0 ? `Vui lòng đợi (${lockTimer}s)` : "Đăng nhập")}
                </button>

                <div>
                    <span>
                        Chưa có tài khoản? <NavLink to="../register" className="text-blue-500 hover:text-red-500 transition-all duration-200">
                            Đăng ký</NavLink> ngay.
                    </span>
                </div>
            </form>
        </div>
    );
};