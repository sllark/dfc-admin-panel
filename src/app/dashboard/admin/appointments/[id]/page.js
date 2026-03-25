"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "@/app/lib/axios";
import AuthGuard from "@/app/lib/authGuard";
import Layout from "@/app/components/common/layout";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import LoadingButton from "@/app/components/ui/LoadingButton";
import { ensureMinDuration } from "@/app/lib/loadingUtils";

export default function AppointmentDetailPage() {
  const params = useParams();
  const id = params?.id;

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [cancelSuccess, setCancelSuccess] = useState(null);
  const [trackingStatus, setTrackingStatus] = useState(null);
  const [loadingTracking, setLoadingTracking] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function fetchAppointment() {
      const startedAt = Date.now();
      try {
        const res = await axios.get(`/api/admin/appointments/${id}`);
        if (!cancelled) {
          setAppointment(res.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              "Failed to load appointment details from Labcorp."
          );
        }
      } finally {
        if (!cancelled) {
          await ensureMinDuration(startedAt, 600);
          setLoading(false);
        }
      }
    }

    fetchAppointment();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleCancel = async () => {
    if (!appointment) return;
    const confirmed = window.confirm(
      "Cancellation is permanent. Are you sure you want to cancel this appointment?"
    );
    if (!confirmed) return;

    const startedAt = Date.now();
    setCancelling(true);
    setCancelError(null);
    setCancelSuccess(null);

    try {
      await axios.put(`/api/admin/appointments/${id}/cancel`, {
        firstName: appointment.patient?.firstName,
        lastName: appointment.patient?.lastName,
      });
      setCancelSuccess(
        "Appointment cancelled successfully. Patient will receive a cancellation message if contact details are on file."
      );
    } catch (err) {
      setCancelError(
        err?.response?.data?.message ||
          "Failed to cancel appointment. Please try again."
      );
    } finally {
      await ensureMinDuration(startedAt, 600);
      setCancelling(false);
    }
  };

  const handleLoadTracking = async () => {
    const trackingId = appointment?.trackingId;
    if (!trackingId) return;

    const startedAt = Date.now();
    setLoadingTracking(true);
    setTrackingStatus(null);
    try {
      const res = await axios.get(
        `/api/admin/appointments/tracking/${encodeURIComponent(trackingId)}`
      );
      setTrackingStatus(res.data);
    } catch (err) {
      setTrackingStatus({
        error:
          err?.response?.data?.message ||
          "Failed to load tracking status. Please try again.",
      });
    } finally {
      await ensureMinDuration(startedAt, 600);
      setLoadingTracking(false);
    }
  };

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold text-white">
            Appointment Details
          </h1>

          {loading && <LoadingSpinner message="Loading appointment…" />}

          {error && (
            <div className="rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm">
              <p className="font-medium text-red-300">Error</p>
              <p className="text-red-200 mt-1">{error}</p>
            </div>
          )}

          {!loading && !error && appointment && (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-400">Confirmation #</p>
                    <p className="text-lg font-semibold text-gray-100">
                      {appointment.confirmationNumber || id}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <LoadingButton
                      onClick={handleCancel}
                      loading={cancelling}
                      spinnerColor="#ef4444"
                      className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-100 disabled:cursor-not-allowed"
                    >
                      Cancel Appointment
                    </LoadingButton>
                  </div>
                </div>

                {cancelError && (
                  <p className="mt-2 text-sm text-red-300">{cancelError}</p>
                )}
                {cancelSuccess && (
                  <p className="mt-2 text-sm text-emerald-300">
                    {cancelSuccess}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
                  <h2 className="text-md font-semibold text-gray-100 mb-2">
                    Patient
                  </h2>
                  <p className="text-sm text-gray-300">
                    {appointment.patient?.firstName}{" "}
                    {appointment.patient?.lastName}
                  </p>
                  {appointment.patient?.dateOfBirth && (
                    <p className="text-sm text-gray-300 mt-1">
                      DOB:{" "}
                      {new Date(
                        appointment.patient.dateOfBirth
                      ).toLocaleDateString()}
                    </p>
                  )}
                  {appointment.patient?.email && (
                    <p className="text-sm text-gray-300 mt-1">
                      Email: {appointment.patient.email}
                    </p>
                  )}
                  {appointment.patient?.phone && (
                    <p className="text-sm text-gray-300 mt-1">
                      Phone: {appointment.patient.phone}
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
                  <h2 className="text-md font-semibold text-gray-100 mb-2">
                    Location & Service
                  </h2>
                  <p className="text-sm text-gray-300">
                    {appointment.location?.name}
                  </p>
                  {appointment.location?.address && (
                    <p className="text-sm text-gray-300 mt-1">
                      {appointment.location.address.line1}
                      {appointment.location.address.line2
                        ? `, ${appointment.location.address.line2}`
                        : ""}
                      {", "}
                      {appointment.location.address.city},{" "}
                      {appointment.location.address.state}{" "}
                      {appointment.location.address.postalCode}
                    </p>
                  )}
                  {appointment.service && (
                    <p className="text-sm text-gray-300 mt-1">
                      Service: {appointment.service.name} (ID:{" "}
                      {appointment.service.id})
                    </p>
                  )}
                  {appointment.time && (
                    <p className="text-sm text-gray-300 mt-1">
                      Time:{" "}
                      {new Date(appointment.time).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-md font-semibold text-gray-100">
                    Tracking Status
                  </h2>
                  <LoadingButton
                    onClick={handleLoadTracking}
                    loading={loadingTracking}
                    disabled={!appointment?.trackingId}
                    spinnerColor="#22d3ee"
                    className="rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-gray-900 hover:bg-cyan-400 disabled:opacity-100 disabled:cursor-not-allowed"
                  >
                    Refresh status
                  </LoadingButton>
                </div>
                {!appointment?.trackingId && (
                  <p className="text-xs text-gray-400">
                    No tracking ID associated with this appointment.
                  </p>
                )}
                {trackingStatus && (
                  <p className="text-sm text-gray-200">
                    {trackingStatus.error
                      ? trackingStatus.error
                      : `Status: ${trackingStatus.status || "Unknown"}`}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </Layout>
    </AuthGuard>
  );
}

