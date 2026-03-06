import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const REF_STORAGE_KEY = "ref";

export default function ReferralRedirectPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (code) {
      localStorage.setItem(REF_STORAGE_KEY, code);
    }
    navigate("/", { replace: true });
  }, [code, navigate]);

  return null;
}
