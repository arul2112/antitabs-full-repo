/**
 * Profile Dropdown Component
 * Minimalist design matching AntiTabs theme
 */

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, signOut } from "../lib/authHelpers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";

export function ProfileDropdown() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      navigate("/");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  if (loading) {
    return (
      <div className="w-8 h-8 border-2 border-black/10 border-t-black rounded-full animate-spin"></div>
    );
  }

  // If user is not logged in
  if (!user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 px-4 text-black/80 hover:text-black hover:bg-black/5 transition-all rounded-full"
          >
            <span className="text-sm">Account</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-white border border-black/10 rounded-2xl p-2 shadow-lg">
          <DropdownMenuItem asChild>
            <Link
              to="/login"
              className="px-3 py-2.5 text-sm text-black/80 hover:text-black hover:bg-black/5 rounded-xl cursor-pointer transition-all"
            >
              Login
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              to="/signup"
              className="px-3 py-2.5 text-sm text-black/80 hover:text-black hover:bg-black/5 rounded-xl cursor-pointer transition-all"
            >
              Sign Up
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // If user is logged in
  const userName = user.user_metadata?.full_name || user.email;
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-10 px-3 hover:bg-black/5 rounded-full transition-all"
        >
          <div className="w-7 h-7 bg-black text-white rounded-full flex items-center justify-center text-xs font-medium">
            {userInitial}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-white border border-black/10 rounded-2xl p-2 shadow-lg">
        <div className="px-3 py-2.5 mb-1">
          <p className="text-sm font-medium text-black">{userName}</p>
          <p className="text-xs text-black/50 mt-0.5">{user.email}</p>
        </div>
        <DropdownMenuSeparator className="bg-black/5 my-1" />
        <DropdownMenuItem asChild>
          <Link
            to="/profile"
            className="px-3 py-2.5 text-sm text-black/80 hover:text-black hover:bg-black/5 rounded-xl cursor-pointer transition-all"
          >
            Manage Subscription
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            to="/pricing"
            className="px-3 py-2.5 text-sm text-black/80 hover:text-black hover:bg-black/5 rounded-xl cursor-pointer transition-all"
          >
            Pricing
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-black/5 my-1" />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="px-3 py-2.5 text-sm text-black/60 hover:text-black hover:bg-black/5 rounded-xl cursor-pointer transition-all"
        >
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
