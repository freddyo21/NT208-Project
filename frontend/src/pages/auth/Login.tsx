import { useState, useEffect, useRef, useCallback, SubmitEvent } from "react";
import { useLogin } from "@/hooks/useLogin";
import { useClock } from "@/hooks/useClock";
import "./Login.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { useTitle } from "@/hooks/useTitle";
import { getAccessToken } from "@/utilities/accessToken";
import { useNavigate } from "react-router";

export default function Login() {
    useTitle("Login");
    const time = useClock();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);

    const { login, loading } = useLogin();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRemember] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPass, setShowPass] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const checkLoggedUser = async () => {
            try {
                const token = await getAccessToken();
                if (token) {
                    navigate("/dashboard", { replace: true });
                }
            } catch (err) {
                console.log("Sentinel: Guest mode active.");
            }
        };
        checkLoggedUser();
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();

        window.addEventListener("resize", resize, { passive: true });

        let cols = Math.floor(canvas.width / 18);
        let drops = Array(cols).fill(1);

        let lastFrame = 0;
        const frameDelay = 45;

        const render = (timestamp: number) => {
            if (timestamp - lastFrame < frameDelay) {
                animationRef.current = window.requestAnimationFrame(render);
                return;
            }
            lastFrame = timestamp;

            ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#00ff41";
            ctx.font = "16px 'MS Gothic', monospace";

            const nextCols = Math.floor(canvas.width / 18);
            if (nextCols !== cols) {
                cols = nextCols;
                drops = Array(cols).fill(1);
            }

            drops.forEach((y, i) => {
                ctx.fillText(String.fromCharCode(0x30A0 + Math.random() * 96), i * 18, y * 16); // Đây là để hiện các ký tự katakana ngẫu nhiên, tạo cảm giác "ma trận" hơn
                // ctx.fillText(String.fromCharCode(0x30 + Math.random() * 2), i * 18, y * 16); // Đây là để hiện 0 và 1
                // ctx.fillText(String.fromCharCode(0x4E00 + Math.random() * 20000), i * 18, y * 16); // Đây là để hiện các chữ cái kanji ngẫu nhiên
                if (y * 16 > canvas.height && Math.random() > 0.975) drops[i] = 0;
                drops[i]++;
            });

            animationRef.current = window.requestAnimationFrame(render);
        };

        animationRef.current = window.requestAnimationFrame(render);

        return () => {
            if (animationRef.current !== null) window.cancelAnimationFrame(animationRef.current);
            window.removeEventListener("resize", resize);
        };
    }, []);

    const handleSubmit = useCallback(async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        if (!email.trim()) return setError("Email cannot be empty.");
        if (!password.trim()) return setError("Password cannot be empty.");
        // setLoading(true);

        try {
            await login(email.trim(), password, rememberMe);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } }; message?: string };
            setError(e?.response?.data?.message ?? e?.message ?? "Login failed.");
        } finally {
            // setLoading(false);
        }
    }, [email, password, rememberMe, login]);

    return (
        <div className="lg-root">
            <canvas ref={canvasRef} className="lg-matrix" />
            <div className="lg-scanline" />

            <header className="lg-topbar">
                <span className="lg-brand">SENTINEL</span>
                <span className="lg-sep"> // </span>
                <span className="lg-ver">ATK-VIG 3.1</span>
                <span className="lg-sep"> // </span>
                <span className="lg-live"><span className="lg-led" /> LIVE FEED</span>
                <span className="lg-sep"> // </span>
                <span className="lg-clock">{time}</span>
                <span className="lg-spacer" />
                <span className="lg-restricted">● ACCESS RESTRICTED</span>
            </header>

            <main className="lg-center">
                <div className="lg-card">
                    <div className="lg-chrome">
                        <span className="lg-dot lg-dot--r" />
                        <span className="lg-dot lg-dot--y" />
                        <span className="lg-dot lg-dot--g" />
                        <span className="lg-chrome-title">AUTH_TERMINAL :: SECURE ACCESS</span>
                    </div>

                    <div className="lg-body">
                        <div className="lg-header">
                            <div className="lg-logo">
                                <span className="lg-dim">[</span>
                                SENTINEL
                                <span className="lg-dim">]</span>
                            </div>
                            <div className="lg-subtitle">ATTACK VISUALIZATION SYSTEM v3.1</div>
                            <div className="lg-tagline"><span className="lg-led" /> SECURE ACCESS TERMINAL</div>
                        </div>

                        <div className="lg-divider">
                            <span className="lg-line" /><span className="lg-div-text">AUTH REQUIRED</span><span className="lg-line" />
                        </div>

                        <form onSubmit={handleSubmit} noValidate>
                            <div className="lg-field">
                                <label className="lg-label" htmlFor="lg-email"><span className="lg-prompt">&gt;</span> EMAIL</label>
                                <input id="lg-email" className="lg-input" type="email"
                                    placeholder="operator@sentinel.io" value={email} disabled={loading}
                                    onChange={e => { setEmail(e.target.value); setError(null); }} />
                            </div>

                            <div className="lg-field">
                                <label className="lg-label" htmlFor="lg-pass"><span className="lg-prompt">&gt;</span> PASSWORD</label>
                                <div className="lg-pw-wrap">
                                    <input id="lg-pass" className="lg-input lg-input--pw"
                                        type={showPass ? "text" : "password"}
                                        placeholder="••••••••" value={password} disabled={loading}
                                        onChange={e => { setPassword(e.target.value); setError(null); }} />
                                    <button type="button" className="lg-eye" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                                        <FontAwesomeIcon icon={showPass ? faEye : faEyeSlash} />
                                    </button>
                                </div>
                            </div>

                            <label className="lg-remember">
                                <input type="checkbox" className="lg-cb" checked={rememberMe}
                                    onChange={e => setRemember(e.target.checked)} disabled={loading} />
                                <span className="lg-cb-box" />
                                <span className="lg-cb-label">REMEMBER SESSION</span>
                            </label>

                            {error && <div className="lg-error" role="alert">! {error}</div>}

                            <button type="submit" className={`lg-btn${loading ? " lg-btn--busy" : ""}`} disabled={loading}>
                                {loading
                                    ? <><span className="lg-spin" /> AUTHENTICATING...</>
                                    : <><span className="lg-arr">&gt;&gt;</span> INITIALIZE SESSION</>}
                            </button>
                        </form>

                        <div className="lg-footer">NT208 — ATTACK VISUALIZATION SYSTEM</div>
                    </div>
                </div>
            </main>
        </div>
    );
}
