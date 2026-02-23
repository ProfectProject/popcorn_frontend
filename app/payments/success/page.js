"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getClientApiBaseUrl } from "../../../lib/clientApiBase";

export const dynamic = 'force-dynamic';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  const paymentApiBase = getClientApiBaseUrl();

  // JWT 토큰 불필요 - orderId 기반 간단 결제 승인

  const [status, setStatus] = useState("confirming");
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(5);
  const hasConfirmedRef = useRef(false);
  const [latestStatus, setLatestStatus] = useState("");
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentOrdersLoading, setRecentOrdersLoading] = useState(false);
  const fetchNoStore = (url, options = {}) => {
    const hasQuery = url.includes("?");
    const cacheBustedUrl = `${url}${hasQuery ? "&" : "?"}_t=${Date.now()}`;
    return fetch(cacheBustedUrl, {
      cache: "no-store",
      ...options,
      headers: {
        "Cache-Control": "no-cache",
        ...(options.headers || {})
      }
    });
  };
  const mergeRecentOrders = (incoming = []) => {
    setRecentOrders((prev) => {
      const merged = [...incoming, ...prev];
      const deduped = [];
      const seen = new Set();

      merged.forEach((item) => {
        const key = String(item?.orderId || item?.orderNo || item?.paymentKey || Math.random());
        if (seen.has(key)) return;
        seen.add(key);
        deduped.push(item);
      });
      return deduped.slice(0, 5);
    });
  };
  const sanitize = (value) => {
    if (!value) {
      return "-";
    }
    return String(value).replace(/[^A-Za-z0-9@._-]/g, "");
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.location.href = window.location.href;
        window.close();
      } catch (err) {
        // ignore cross-window errors
      }
    }
  }, []);

  useEffect(() => {
    if (!orderId) return;
    mergeRecentOrders([{
      orderId,
      orderNo: orderId,
      status: "PENDING",
      amount: Number(amount) || amount
    }]);
  }, [orderId, amount]);

  useEffect(() => {
    const confirmPayment = async () => {
      if (hasConfirmedRef.current) {
        return;
      }
      hasConfirmedRef.current = true;
      if (!paymentKey || !orderId || !amount) {
        setStatus("error");
        setMessage("결제 승인 파라미터가 부족합니다.");
        return;
      }

      try {
        const headers = {
          "Content-Type": "application/json"
        };

        const response = await fetchNoStore(`${paymentApiBase}/api/pay/v1/payments/confirm-async`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: Number(amount)
          })
        });

        if (!response.ok && response.status !== 202) {
          let errorMessage = "결제 승인에 실패했습니다.";
          try {
            const errorResult = await response.json();
            errorMessage = errorResult.message || errorMessage;
          } catch (parseError) {
            // JSON 파싱 실패 시 기본 메시지 사용
          }
          setStatus("error");
          setMessage(`${errorMessage} (HTTP ${response.status})`);
          return;
        }

        const result = await response.json();
        const confirmed = result?.data;
        if (confirmed && typeof confirmed === "object") {
          mergeRecentOrders([confirmed]);
        } else {
          mergeRecentOrders([{
            orderId,
            orderNo: orderId,
            status: "PAID",
            amount: Number(amount) || amount
          }]);
        }
        if (response.status === 202) {
          setStatus("pending");
          setMessage("승인 처리 중입니다. 잠시 후 결제 내역을 확인해주세요.");
          return;
        }
        setStatus("success");
        setMessage(`승인 완료: ${result?.data?.orderStatus || "PAID"}`);
      } catch (err) {
        setStatus("error");
        setMessage(`네트워크 오류: ${err.message}`);
      }
    };

    confirmPayment();
  }, [paymentKey, orderId, amount, paymentApiBase]);

  useEffect(() => {
    if (!orderId || (status !== "pending" && status !== "success")) {
      return;
    }
    let attempts = 0;
    const maxAttempts = status === "pending" ? 10 : 4;
    const intervalId = setInterval(async () => {
      attempts += 1;
      try {
        const response = await fetchNoStore(`${paymentApiBase}/api/pay/v1/payments/orders/${orderId}/latest`);
        if (!response.ok) {
          return;
        }
        const result = await response.json();
        const paymentStatus = result?.data?.status;
        if (paymentStatus) {
          setLatestStatus(paymentStatus);
          mergeRecentOrders([{
            orderId,
            orderNo: orderId,
            status: paymentStatus,
            amount: Number(amount) || amount
          }]);
        }
        if (status === "pending" && paymentStatus === "PAID") {
          setStatus("success");
          setMessage("결제가 성공적으로 완료되었습니다.");
          clearInterval(intervalId);
          return;
        }
        if (status === "pending" && (paymentStatus === "FAILED" || paymentStatus === "CANCELLED")) {
          setStatus("error");
          setMessage(`결제가 ${paymentStatus} 상태입니다.`);
          clearInterval(intervalId);
          return;
        }
      } catch (err) {
        // ignore polling errors
      }
      if (attempts >= maxAttempts) {
        setMessage("승인 처리 지연 중입니다. 잠시 후 다시 확인해주세요.");
        clearInterval(intervalId);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [status, orderId, paymentApiBase, amount]);

  useEffect(() => {
    if (!orderId) return;

    const normalizeOrderList = (payload) => {
      const data = payload?.data ?? payload;
      if (Array.isArray(data)) return data;
      if (!data || typeof data !== "object") return [];

      const candidates = [
        data.recentOrders,
        data.orders,
        data.orderHistory,
        data.history,
        data.paymentHistory,
        data.items
      ];
      const firstArray = candidates.find((value) => Array.isArray(value));
      if (firstArray) return firstArray;

      if (data.orderId || data.orderNo || data.paymentKey || data.status) {
        return [data];
      }
      return [];
    };

    const loadRecentOrders = async () => {
      setRecentOrdersLoading(true);
      try {
        // 우선 최신 결제 상태 응답에서 내역 후보를 파싱한다.
        const latestRes = await fetchNoStore(`${paymentApiBase}/api/pay/v1/payments/orders/${orderId}/latest`);
        if (latestRes.ok) {
          const latestPayload = await latestRes.json();
          const normalized = normalizeOrderList(latestPayload);
          if (normalized.length > 0) {
            mergeRecentOrders(normalized);
            return;
          }
        }

        // 최신 응답에 배열이 없을 때 상세 조회를 한 번 더 시도한다.
        const detailRes = await fetchNoStore(`${paymentApiBase}/api/pay/v1/payments/orders/${orderId}`);
        if (!detailRes.ok) {
          setRecentOrders([]);
          return;
        }
        const detailPayload = await detailRes.json();
        const normalized = normalizeOrderList(detailPayload);
        if (normalized.length > 0) {
          mergeRecentOrders(normalized);
        }
      } catch (_error) {
        // Keep already seeded "just paid" order row even when history lookup fails.
      } finally {
        setRecentOrdersLoading(false);
      }
    };

    loadRecentOrders();
  }, [orderId, paymentApiBase]);

  // 결제 성공 시 카운트다운 후 홈으로 리다이렉트
  useEffect(() => {
    if (status === "success" && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (status === "success" && countdown === 0) {
      router.push("/");
    }
  }, [status, countdown, router]);

  return (
    <main>
      <div className="container">
        <section className="hero">
          <h1 className="title">
            {status === "success"
              ? "결제 완료"
              : status === "error"
              ? "결제 실패"
              : status === "pending"
              ? "결제 승인 처리 중"
              : "결제 승인 중"}
          </h1>
          <p className="subtitle">
            {status === "success"
              ? "결제가 성공적으로 완료되었습니다."
              : status === "error"
              ? "결제 승인 과정에서 문제가 발생했습니다."
              : status === "pending"
              ? "승인 처리 중입니다."
              : "승인 결과를 확인하고 있습니다."}
          </p>

          <div className="status">
            <p className="mono">paymentKey: {sanitize(paymentKey)}</p>
            <p className="mono">orderId: {sanitize(orderId)}</p>
            <p className="mono">amount: {sanitize(amount)}</p>
            <p className="mono">status: {status}</p>
            {latestStatus ? <p className="mono">paymentStatus: {latestStatus}</p> : null}
            {message ? <p>{message}</p> : null}
          </div>

          <div className="status" style={{ marginTop: "16px", textAlign: "left" }}>
            <p className="mono" style={{ marginBottom: "8px" }}>최근 주문 내역</p>
            {recentOrdersLoading ? (
              <p>주문 내역을 불러오는 중...</p>
            ) : recentOrders.length === 0 ? (
              <p>표시할 최근 주문 내역이 없습니다.</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: "20px" }}>
                {recentOrders.map((order, index) => (
                  <li key={`${order?.orderId || order?.orderNo || "order"}-${index}`}>
                    {sanitize(order?.orderNo || order?.orderId || "-")} · {sanitize(order?.status || order?.orderStatus || "-")} · {sanitize(order?.amount || order?.paymentAmount || amount || "-")}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {status === "success" && (
            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <p>{countdown}초 후 메인 페이지로 이동합니다.</p>
              <button
                className="button"
                onClick={() => router.push("/")}
                style={{ marginTop: "10px" }}
              >
                지금 이동하기
              </button>
            </div>
          )}

          {status === "error" && (
            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <button
                className="button"
                onClick={() => router.push("/")}
                style={{ marginTop: "10px" }}
              >
                메인 페이지로 이동
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>결제 승인 확인 중...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
