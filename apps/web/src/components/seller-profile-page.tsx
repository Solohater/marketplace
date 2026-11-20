"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useMe } from "@/lib/user";
import { useI18n } from "@/lib/i18n";
import { Button, ErrorBanner, Field, SuccessBanner } from "@/components/ui";

interface SellerProfile {
  id: string;
  userId: string;
  storeName: string;
  storeDescription: string | null;
  logoUrl: string | null;
  phone: string | null;
  locationId: string | null;
  address: string | null;
  isVerified: boolean;
  verificationLevel: string;
  memberSince: string;
  lastActiveAt: string | null;
}

export function SellerProfilePage() {
  const { t } = useI18n();
  const { user, loading } = useMe();
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const data = await api<{ profile: SellerProfile | null }>("/api/sellers/me");
      setProfile(data.profile);
      if (data.profile) {
        setStoreName(data.profile.storeName);
        setStoreDescription(data.profile.storeDescription ?? "");
        setPhone(data.profile.phone ?? "");
        setAddress(data.profile.address ?? "");
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function createProfile(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    setMessage(undefined);
    try {
      await api("/api/sellers", {
        method: "POST",
        body: JSON.stringify({
          storeName,
          storeDescription: storeDescription || undefined,
          phone: phone || undefined,
          address: address || undefined,
        }),
      });
      setMessage("Seller profile created successfully!");
      setIsEditing(false);
      await loadProfile();
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      setError(code ? `Failed to create profile: ${code}` : "Failed to create profile");
    } finally {
      setBusy(false);
    }
  }

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    setMessage(undefined);
    try {
      await api("/api/sellers/me", {
        method: "PATCH",
        body: JSON.stringify({
          storeName,
          storeDescription: storeDescription || undefined,
          phone: phone || undefined,
          address: address || undefined,
        }),
      });
      setMessage("Seller profile updated successfully!");
      setIsEditing(false);
      await loadProfile();
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      setError(code ? `Failed to update profile: ${code}` : "Failed to update profile");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user) {
    return <p className="empty">{t("account.loading")}</p>;
  }

  if (user.role !== "SELLER" && user.role !== "ADMIN") {
    return (
      <div>
        <div className="page-head">
          <h1>Seller Profile</h1>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p>You need to create a seller profile to start selling.</p>
          <Button
            className="btn-primary"
            onClick={() => setIsEditing(true)}
            style={{ marginTop: 16 }}
          >
            Create Seller Profile
          </Button>
        </div>

        {isEditing && (
          <div className="card" style={{ padding: 16, marginTop: 16 }}>
            <form onSubmit={createProfile} noValidate>
              <h2>Create Your Store</h2>
              <ErrorBanner message={error} />
              <SuccessBanner message={message} />
            <Field label="Store Name">
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
                minLength={2}
                maxLength={100}
              />
            </Field>
              <Field label="Store Description">
                <textarea
                  value={storeDescription}
                  onChange={(e) => setStoreDescription(e.target.value)}
                  maxLength={1000}
                  rows={4}
                />
              </Field>
              <Field label="Phone">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Field>
              <Field label="Address">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </Field>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <Button type="submit" className="btn-primary" disabled={busy}>
                  Create Profile
                </Button>
                <Button type="button" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <h1>Seller Profile</h1>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        )}
      </div>

      {profile && (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <div className="avatar" style={{ width: 64, height: 64, fontSize: 24 }}>
              {profile.storeName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2>{profile.storeName}</h2>
              <p className="muted">
                {profile.isVerified ? "✓ Verified Seller" : "Not Verified"}
              </p>
              <p className="muted">
                Member since {new Date(profile.memberSince).toLocaleDateString()}
              </p>
            </div>
          </div>

          {profile.storeDescription && (
            <p style={{ marginBottom: 16 }}>{profile.storeDescription}</p>
          )}

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {profile.phone && (
              <div>
                <strong>Phone:</strong> {profile.phone}
              </div>
            )}
            {profile.address && (
              <div>
                <strong>Address:</strong> {profile.address}
              </div>
            )}
          </div>
        </div>
      )}

      {isEditing && (
        <div className="card" style={{ padding: 16, marginTop: 16 }}>
          <form onSubmit={updateProfile} noValidate>
            <h2>Edit Store</h2>
            <ErrorBanner message={error} />
            <SuccessBanner message={message} />
            <Field label="Store Name">
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
                minLength={2}
                maxLength={100}
              />
            </Field>
            <Field label="Store Description">
              <textarea
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                maxLength={1000}
                rows={4}
              />
            </Field>
            <Field label="Phone">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
            <Field label="Address">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </Field>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <Button type="submit" className="btn-primary" disabled={busy}>
                Save Changes
              </Button>
              <Button type="button" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
