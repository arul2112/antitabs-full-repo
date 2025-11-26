/**
 * Success Page
 * Payment successful - download app and login
 */

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getPaymentDetails, clearPaymentDetails } from "../lib/razorpayCheckout";
import { Button } from "../components/ui/button";
import { Download } from "lucide-react";

export default function SuccessPage() {
  const navigate = useNavigate();
  const [paymentInfo, setPaymentInfo] = useState<any>(null);

  useEffect(() => {
    const details = getPaymentDetails();
    if (!details) {
      navigate("/pricing");
      return;
    }

    setPaymentInfo(details);
  }, [navigate]);

  const handleContinue = () => {
    clearPaymentDetails();
    navigate("/profile");
  };

  if (!paymentInfo) {
    return null;
  }

  const planName = paymentInfo.plan_type === 'monthly' ? 'Monthly Plan' : 'Yearly Plan';
  const amount = paymentInfo.plan_type === 'monthly' ? '₹199/month' : '₹1,999/year';

  return (
    <section className="relative min-h-screen bg-white py-20 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-black/5 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-black/5 rounded-full mb-6">
              <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-2xl">
                ✓
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl tracking-tight text-black mb-4">
              Payment successful
            </h1>
            <p className="text-xl text-black/50">
              Welcome to AntiTabs Premium
            </p>
          </div>

          {/* Payment Details */}
          <div className="bg-white/80 backdrop-blur-sm border border-black/10 rounded-3xl p-8 mb-8">
            <h2 className="text-2xl tracking-tight text-black mb-6">Transaction Details</h2>

            <div className="space-y-4 text-base">
              <div className="flex justify-between items-center py-3 border-b border-black/5">
                <span className="text-black/60">Plan</span>
                <span className="text-black font-medium">{planName}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-black/5">
                <span className="text-black/60">Amount</span>
                <span className="text-black font-medium">{amount}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-black/5">
                <span className="text-black/60">Payment ID</span>
                <span className="text-black font-mono text-sm">{paymentInfo.payment_id}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-black/60">Date</span>
                <span className="text-black font-medium">
                  {new Date(paymentInfo.timestamp).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="mt-6 bg-black/5 border border-black/10 rounded-2xl p-4">
              <p className="text-sm text-black/70">
                Need an invoice? Email us at{" "}
                <a
                  href="mailto:antitabs.ai@gmail.com?subject=Invoice Request"
                  className="font-medium text-black hover:underline"
                >
                  antitabs.ai@gmail.com
                </a>
              </p>
            </div>
          </div>

          {/* Download Section */}
          <div className="bg-black text-white rounded-3xl p-8 mb-8">
            <h2 className="text-2xl tracking-tight mb-4">Download AntiTabs</h2>
            <p className="text-white/70 mb-6">
              Get started with AntiTabs on your desktop
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <a
                href="#"
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-2xl p-6 transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-center gap-4">
                  <Download className="w-8 h-8" />
                  <div>
                    <div className="font-medium text-lg">macOS</div>
                    <div className="text-sm text-white/60">Intel & Apple Silicon</div>
                  </div>
                </div>
              </a>

              <a
                href="#"
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-2xl p-6 transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-center gap-4">
                  <Download className="w-8 h-8" />
                  <div>
                    <div className="font-medium text-lg">Windows</div>
                    <div className="text-sm text-white/60">64-bit</div>
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-white/80 backdrop-blur-sm border border-black/10 rounded-3xl p-8 mb-8">
            <h3 className="text-xl tracking-tight text-black mb-6">Next Steps</h3>
            <ol className="space-y-4 text-black/70">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </span>
                <span>Download and install AntiTabs for your operating system</span>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </span>
                <span>Launch the app and login with your email and password</span>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </span>
                <span>Start enjoying unlimited browser windows in one canvas</span>
              </li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleContinue}
              className="bg-black text-white hover:bg-black/90 rounded-full px-8 h-12 text-base transition-all duration-300 hover:scale-105"
            >
              View Profile
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-2 border-black/20 text-black hover:bg-black/5 rounded-full px-8 h-12 text-base transition-all duration-300 hover:scale-105"
            >
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
