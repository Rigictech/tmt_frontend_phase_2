import { Fragment, useEffect, useMemo, useState } from "react";
import { Row, Col, Form, Button } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/app/providers/AuthProvider";
import { useLogin } from "@/features/auth/hooks/useLogin";
import { useTranslation } from "react-i18next";

const isAdminUser = (user) => {
    const role =
        user?.role?.name ||
        user?.role_name ||
        user?.role ||
        user?.roles?.[0]?.name ||
        user?.roles?.[0];

    return String(role || "").toLowerCase() === "administrator" || String(role || "").toLowerCase() === "admin";
};

export default function LoginPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const location = useLocation();

    const { me, isAuthed, authLoading, setMe } = useAuth();
    const loginMutation = useLogin();

    const [formData, setFormData] = useState({ email: "", password: "" });
    const [errorMessages, setErrorMessages] = useState({
        email: "",
        password: "",
        message: "",
    });
    const [showPassword, setShowPassword] = useState(false);

    const loading = loginMutation.isPending;

    // If already logged in, route based on role
    useEffect(() => {
        if (authLoading) return;
        if (!isAuthed) return;

        if (isAdminUser(me)) navigate("/dashboard", { replace: true });
        else navigate("/", { replace: true });
    }, [authLoading, isAuthed, me, navigate]);

    // Auto-clear message after 3s (same as your old behavior)
    useEffect(() => {
        if (!errorMessages.message) return;
        const id = setTimeout(() => {
            setErrorMessages((prev) => ({ ...prev, message: "" }));
        }, 3000);
        return () => clearTimeout(id);
    }, [errorMessages.message]);

    const togglePasswordVisibility = () => setShowPassword((p) => !p);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrorMessages((prev) => ({ ...prev, [name]: "", message: "" }));
    };

    const validate = () => {
        let hasErrors = false;
        const next = { email: "", password: "", message: "" };

        if (!formData.email) {
            next.email = t("email_required");
            hasErrors = true;
        }

        if (!formData.password) {
            next.password = t("password_required");
            hasErrors = true;
        }

        setErrorMessages(next);
        return !hasErrors;
    };

    const onSuccessRedirect = (user) => {
        // Keep behavior: go admin dashboard or home
        if (isAdminUser(user)) navigate("/dashboard", { replace: true });
        else navigate("/", { replace: true });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            const responseData = await loginMutation.mutateAsync({
                email: formData.email,
                password: formData.password,
            });

            // Expecting your old API-like response shape:
            // { status: true, data: { access_token, user } }
            if (!responseData?.status) {
                setErrorMessages((prev) => ({
                    ...prev,
                    message: responseData?.message || t("Login failed. Please try again."),
                }));
                return;
            }

            const accessToken = responseData?.data?.access_token;
            const user = responseData?.data?.user;

            // OTP flow (same logic as your previous code)
            if (!accessToken) {
                navigate("/verify-otp", {
                    state: {
                        email: formData.email,
                        password: formData.password,
                        from: location.state?.from,
                    },
                });
                return;
            }

            // Production rule: store only access token in memory (AuthProvider does it)
            // We call AuthProvider login() if you have it. If not, setMe() fallback.
            // If your AuthProvider exposes login(accessToken, user) use that instead.
            // For now, we setMe + navigate, and httpClient can use access token store.
            // Update this line if your provider exposes login().
            setMe(user);
            onSuccessRedirect(user);
        } catch (error) {
            const err = error?.response?.data;

            if (err?.errors) {
                setErrorMessages((prev) => ({ ...prev, ...err.errors }));
            } else if (err?.message) {
                setErrorMessages((prev) => ({ ...prev, message: err.message }));
            } else {
                setErrorMessages((prev) => ({
                    ...prev,
                    message: t("An unexpected error occurred. Please try again."),
                }));
            }
        }
    };

    // Optional: disable form while logged-in boot is running
    const isFormDisabled = useMemo(() => authLoading || loading, [authLoading, loading]);

    return (
        <Fragment>
            <div className="vh-100">
                <Row className="justify-content-center align-items-center py-5 h-100 mx-2 mx-md-0">
                    <Col md={9}>
                        <div className="basic-card login-registration-card">
                            <img className="card-logo" src="/tmt_logo.png" alt="logo" />
                            <h2 className="text-center mb-4">{t("SignIn")}</h2>

                            {errorMessages.message && (
                                <p className="alert alert-danger">{errorMessages.message}</p>
                            )}

                            <Form onSubmit={handleSubmit}>
                                <Form.Group controlId="formBasicEmail" className="mb-3">
                                    <Form.Label>
                                        {t("Email address")}<span className="asterisk-sign">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder={t("Enter email")}
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        disabled={isFormDisabled}
                                    />
                                </Form.Group>
                                {errorMessages.email && (
                                    <p className="text-danger mt-1">{errorMessages.email}</p>
                                )}

                                <Form.Group className="mb-4 relative" controlId="formBasicPassword">
                                    <Form.Label>
                                        {t("Password")}<span className="asterisk-sign">*</span>
                                    </Form.Label>

                                    <Form.Control
                                        type={showPassword ? "text" : "password"}
                                        placeholder={t("Password")}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        disabled={isFormDisabled}
                                    />

                                    <div className="eye-btn" onClick={togglePasswordVisibility} role="button" tabIndex={0}>
                                        {showPassword ? (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="50"
                                                height="50"
                                                viewBox="0 0 50 50"
                                                fill="none"
                                            >
                                                <path
                                                    d="M25.0002 10.4167C7.04184 10.4167 2.37517 23.7709 2.18767 24.3334C2.04161 24.7659 2.04161 25.2343 2.18767 25.6667C2.37517 26.2292 7.04184 39.5834 25.0002 39.5834C42.9585 39.5834 47.6252 26.2292 47.9168 25.6667C48.0629 25.2343 48.0629 24.7659 47.9168 24.3334C47.6252 23.7709 42.9585 10.4167 25.0002 10.4167ZM25.0002 35.4167C12.1043 35.4167 7.521 27.4376 6.41684 25.0001C7.50017 22.6251 12.1668 14.5834 25.0002 14.5834C37.8335 14.5834 42.5002 22.5834 43.5835 25.0001C42.5002 27.3751 37.8335 35.4167 25.0002 35.4167Z"
                                                    fill="#464255"
                                                />
                                                <path
                                                    d="M24.9994 16.6667C23.3512 16.6667 21.74 17.1555 20.3696 18.0712C18.9992 18.9868 17.9311 20.2883 17.3004 21.8111C16.6696 23.3338 16.5046 25.0093 16.8261 26.6258C17.1477 28.2423 17.9414 29.7272 19.1068 30.8926C20.2722 32.0581 21.7571 32.8518 23.3736 33.1733C24.9901 33.4948 26.6657 33.3298 28.1884 32.6991C29.7111 32.0684 31.0126 31.0002 31.9283 29.6298C32.844 28.2594 33.3327 26.6483 33.3327 25.0001C33.3327 22.7899 32.4547 20.6703 30.8919 19.1075C29.3291 17.5447 27.2095 16.6667 24.9994 16.6667ZM24.9994 29.1668C24.1753 29.1668 23.3697 28.9224 22.6845 28.4645C21.9993 28.0067 21.4652 27.356 21.1499 26.5946C20.8345 25.8332 20.752 24.9955 20.9128 24.1872C21.0735 23.379 21.4704 22.6365 22.0531 22.0538C22.6358 21.4711 23.3782 21.0742 24.1865 20.9135C24.9947 20.7527 25.8325 20.8352 26.5939 21.1506C27.3552 21.466 28.006 22 28.4638 22.6852C28.9217 23.3704 29.166 24.176 29.166 25.0001C29.166 26.1052 28.727 27.165 27.9456 27.9464C27.1642 28.7278 26.1044 29.1668 24.9994 29.1668Z"
                                                    fill="#464255"
                                                />
                                            </svg>
                                        ) : (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="50"
                                                height="50"
                                                viewBox="0 0 50 50"
                                                fill="none"
                                            >
                                                <path
                                                    d="M25.0002 39.5834H27.2293C27.7819 39.5447 28.2964 39.2881 28.6598 38.8701C29.0231 38.452 29.2055 37.9067 29.1668 37.3542C29.1282 36.8017 28.8716 36.2871 28.4535 35.9238C28.0355 35.5604 27.4902 35.378 26.9377 35.4167C26.3127 35.4167 25.6668 35.4167 25.0002 35.4167C12.1043 35.4167 7.50017 27.4167 6.41684 25.0001C7.25834 23.2218 8.40803 21.6066 9.81267 20.2292C10.205 19.8369 10.4254 19.3049 10.4254 18.7501C10.4254 18.1953 10.205 17.6632 9.81267 17.2709C9.42037 16.8786 8.8883 16.6582 8.33351 16.6582C7.77871 16.6582 7.24664 16.8786 6.85434 17.2709C4.81616 19.268 3.2255 21.6753 2.18767 24.3334C2.04161 24.7658 2.04161 25.2343 2.18767 25.6667C2.37517 26.2292 7.04184 39.5834 25.0002 39.5834Z"
                                                    fill="#464255"
                                                />
                                                <path
                                                    d="M47.9174 24.3338C47.6257 23.7713 42.959 10.4171 25.0007 10.4171C21.6123 10.3828 18.2456 10.9616 15.0632 12.1255L9.81321 6.85463C9.42091 6.46233 8.88884 6.24194 8.33404 6.24194C7.77925 6.24194 7.24718 6.46233 6.85488 6.85463C6.46258 7.24693 6.24219 7.77901 6.24219 8.3338C6.24219 8.8886 6.46258 9.42067 6.85488 9.81297L40.1882 43.1463C40.3819 43.3416 40.6123 43.4966 40.8662 43.6023C41.1201 43.7081 41.3924 43.7626 41.6674 43.7626C41.9424 43.7626 42.2147 43.7081 42.4686 43.6023C42.7225 43.4966 42.9529 43.3416 43.1465 43.1463C43.3418 42.9526 43.4968 42.7222 43.6026 42.4683C43.7083 42.2145 43.7628 41.9422 43.7628 41.6671C43.7628 41.3921 43.7083 41.1198 43.6026 40.8659C43.4968 40.6121 43.3418 40.3816 43.1465 40.188L38.9799 36.0213C43.0059 33.6227 46.1261 29.9605 47.8549 25.6046C48.0077 25.1979 48.0296 24.7536 47.9174 24.3338ZM29.1674 26.063L24.084 20.9796C24.3835 20.8985 24.6908 20.8496 25.0007 20.8338C26.1058 20.8338 27.1656 21.2728 27.947 22.0542C28.7284 22.8356 29.1674 23.8954 29.1674 25.0005C29.1627 25.3593 29.1138 25.7162 29.0215 26.063H29.1674ZM36.0215 32.9171L32.1674 29.1671C33.048 27.5839 33.3887 25.7568 33.1379 23.9626C32.8871 22.1684 32.0584 20.5048 30.7774 19.2238C29.4963 17.9428 27.8327 17.1141 26.0385 16.8633C24.2443 16.6125 22.4173 16.9532 20.834 17.8338L18.3757 15.4171C20.5385 14.853 22.7656 14.5729 25.0007 14.5838C37.8965 14.5838 42.5007 22.5838 43.584 25.0005C41.937 28.4026 39.2327 31.18 35.8757 32.9171H36.0215Z"
                                                    fill="#464255"
                                                />
                                                <path
                                                    d="M22.2297 33.2086C22.4502 33.2887 22.6826 33.331 22.9172 33.3336C23.3478 33.3319 23.7674 33.1968 24.1181 32.9468C24.4688 32.6969 24.7334 32.3444 24.8755 31.9378C25.0557 31.4183 25.0232 30.8487 24.7852 30.3531C24.5471 29.8575 24.1228 29.4761 23.6047 29.292C22.3014 28.7373 21.2635 27.6994 20.7089 26.3961C20.6371 26.1164 20.5081 25.8546 20.3298 25.6274C20.1515 25.4002 19.928 25.2125 19.6733 25.0763C19.4186 24.9401 19.1384 24.8584 18.8505 24.8362C18.5626 24.8141 18.2732 24.852 18.0007 24.9477C17.7282 25.0434 17.4785 25.1946 17.2676 25.3919C17.0567 25.5892 16.8891 25.8281 16.7755 26.0936C16.6618 26.3591 16.6046 26.6454 16.6075 26.9342C16.6104 27.2229 16.6733 27.508 16.7922 27.7711C17.2695 29.0064 17.9998 30.1283 18.9362 31.0647C19.8726 32.0011 20.9944 32.7314 22.2297 33.2086Z"
                                                    fill="#464255"
                                                />
                                            </svg>
                                        )}
                                    </div>
                                </Form.Group>

                                {errorMessages.password && (
                                    <p className="text-danger mt-1">{errorMessages.password}</p>
                                )}

                                <Button type="submit" className="w-100" disabled={isFormDisabled}>
                                    {loading ? t("Loading...") : t("SignIn")}
                                </Button>
                            </Form>
                        </div>
                    </Col>
                </Row>
            </div>
        </Fragment>
    );
}