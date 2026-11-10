
"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FileText, ShieldCheck } from "lucide-react";

type ConsentDocument = {
  id: string;
  title: string;
  pdfUrl: string;
  version: string;
};

export default function FinanceConsentPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [document, setDocument] =
        useState<ConsentDocument | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [agreed, setAgreed] = useState(false);
    const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const [hasSignature, setHasSignature] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState("");
        
    const isDrawingRef = useRef(false);

    function getCanvasPoint(
        event: React.PointerEvent<HTMLCanvasElement>
        ) {
        const canvas = event.currentTarget;
        const rect = canvas.getBoundingClientRect();

        return {
            x: ((event.clientX - rect.left) / rect.width) * canvas.width,
            y: ((event.clientY - rect.top) / rect.height) * canvas.height,
        };
        }

        function startSignature(
        event: React.PointerEvent<HTMLCanvasElement>
        ) {
        const canvas = event.currentTarget;
        const context = canvas.getContext("2d");

        if (!context) return;

        event.preventDefault();
        canvas.setPointerCapture(event.pointerId);

        const point = getCanvasPoint(event);

        context.strokeStyle = "#111827";
        context.fillStyle = "#111827";
        context.lineWidth = 3;
        context.lineCap = "round";
        context.lineJoin = "round";

        context.beginPath();
        context.arc(point.x, point.y, 1.5, 0, Math.PI * 2);
        context.fill();

        context.beginPath();
        context.moveTo(point.x, point.y);

        isDrawingRef.current = true;
        setHasSignature(true);
        }

        function moveSignature(
        event: React.PointerEvent<HTMLCanvasElement>
        ) {
        if (!isDrawingRef.current) return;

        event.preventDefault();

        const canvas = event.currentTarget;
        const context = canvas.getContext("2d");

        if (!context) return;

        const point = getCanvasPoint(event);

        context.lineTo(point.x, point.y);
        context.stroke();
        }

        function stopSignature(
        event: React.PointerEvent<HTMLCanvasElement>
        ) {
        isDrawingRef.current = false;

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
        }

        function clearSignature() {
        const canvas = signatureCanvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        context.clearRect(0, 0, canvas.width, canvas.height);
        isDrawingRef.current = false;
        setHasSignature(false);
    }
    
    async function submitConsent() {
        if (
            !token ||
            !document ||
            !agreed ||
            !hasSignature ||
            submitting ||
            submitted
        ) {
            return;
        }

    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    setSubmitting(true);
    setSubmitError("");

    try {
        const signatureData = canvas.toDataURL("image/png");

        const response = await fetch(
        "/api/finance/consent/submit",
        {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify({
            token,
            agreed: true,
            signatureData,
            }),
        }
        );

        const result = await response.json();

        if (!response.ok) {
        throw new Error(
            result.error || "Unable to submit privacy consent."
        );
        }

        setSubmitted(true);
    } catch (error) {
        setSubmitError(
        error instanceof Error
            ? error.message
            : "Unable to submit privacy consent."
        );
    } finally {
        setSubmitting(false);
    }
    }

    useEffect(() => {
        const controller = new AbortController();

        async function loadConsent() {
        if (!token) {
            setError("Invalid privacy consent link.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");
        setDocument(null);
        setAgreed(false);
        clearSignature();

        try {
            const response = await fetch(
            `/api/finance/consent?token=${encodeURIComponent(token)}`,
            {
                cache: "no-store",
                signal: controller.signal,
            }
            );

            const data = await response.json();

            if (!response.ok) {
            throw new Error(
                data.error || "Unable to load privacy consent."
            );
            }

            if (!controller.signal.aborted) {
            setDocument(data.document);
            }
        } catch (error) {
            if (!controller.signal.aborted) {
            setError(
                error instanceof Error
                ? error.message
                : "Unable to load privacy consent."
            );
            }
        } finally {
            if (!controller.signal.aborted) {
            setLoading(false);
            }
        }
        }

        void loadConsent();

        return () => controller.abort();
    }, [token]);

    return (
        <main className="min-h-screen bg-[#090B12] px-4 py-10 text-white">
        <div className="mx-auto max-w-3xl">
            <div className="mb-8 flex items-center gap-3">
            <ShieldCheck size={28} className="text-cyan-400" />
            <div>
                <h1 className="text-2xl font-bold">
                Privacy Consent
                </h1>
                <p className="mt-1 text-sm text-gray-400">
                Carmart Perth — Broker Privacy Consent
                </p>
            </div>
            </div>

            {loading ? (
            <p className="text-gray-400">
                Loading your privacy consent...
            </p>
            ) : error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
                {error}
            </div>
            ) : document ? (
            <div className="rounded-2xl border border-[#393944] bg-[#1c1d24] p-5">
                <div className="mb-4 flex items-center gap-3">
                <FileText size={22} className="text-cyan-400" />
                <div>
                    <h2 className="font-semibold">
                    {document.title}
                    </h2>
                    <p className="text-xs text-gray-400">
                    Version {document.version}
                    </p>
                </div>
                </div>

                <iframe
                src={document.pdfUrl}
                title={document.title}
                className="h-[65vh] w-full rounded-lg border border-[#393944] bg-white"
                />

                <a
                href={document.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300"
                >
                <FileText size={16} />
                Open PDF in new tab
                </a>

                {/* Broker privacy consent agreement */}
                <div className="mt-6 rounded-xl border border-[#393944] bg-[#111116] p-4">
                <label className="flex cursor-pointer items-start gap-3">
                    <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(event) => setAgreed(event.target.checked)}
                    className="mt-1 h-4 w-4 accent-cyan-500"
                    />

                    <span className="text-sm leading-6 text-gray-300">
                    I confirm that I have read and understood the
                    privacy consent document displayed above, and
                    I agree to its terms.
                    </span>
                </label>
                </div>
                
                {/* Handwritten signature */}
                <div className="mt-6 space-y-3">
                <div>
                    <h3 className="text-sm font-semibold text-white">
                    Customer Signature
                    </h3>
                    <p className="mt-1 text-xs text-gray-400">
                    Draw your signature using your mouse or finger.
                    </p>
                </div>

                <canvas
                ref={signatureCanvasRef}
                width={700}
                height={220}
                onPointerDown={startSignature}
                onPointerMove={moveSignature}
                onPointerUp={stopSignature}
                onPointerCancel={stopSignature}
                className="h-[180px] w-full touch-none rounded-xl border border-[#393944] bg-white"
                aria-label="Customer handwritten signature area"
                />
                
                <button
                    type="button"
                    onClick={clearSignature}
                    disabled={!hasSignature}
                    className="rounded-lg border border-[#393944] px-4 py-2 text-sm text-gray-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                Clear Signature
                </button>


                <p className="text-xs text-gray-500">
                    Signature capture is being prepared.
                </p>
                </div>

                {submitted ? (
                <div
                    role="status"
                    className="mt-6 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-green-300"
                >
                    Privacy consent submitted successfully.
                    Thank you for reviewing and signing the document.
                </div>
                ) : (
                <div className="mt-6 space-y-3">
                    {submitError && (
                    <p role="alert" className="text-sm text-red-400">
                        {submitError}
                    </p>
                    )}

                    <button
                    type="button"
                    onClick={submitConsent}
                    disabled={!agreed || !hasSignature || submitting}
                    className="w-full rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                    {submitting ? "Submitting..." : "Submit Privacy Consent"}
                    </button>

                    <p className="text-xs text-gray-400">
                    By submitting, you confirm your agreement to the
                    privacy consent document displayed above.
                    </p>
                </div>
                )}
            </div>
            ) : null}
        </div>
        </main>
    );
}
