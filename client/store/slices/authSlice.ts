import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { axiosClient } from "@/lib/axios";

type User = { User_Id: string; Name: string; Email: string; Role: "ADMIN" | "USER"; [key: string]: any } | null;

type SignupProgress = {
  email: string;
  stage: "EMAIL_VERIFICATION" | "PROFILE_SETUP" | "TWO_FA_SETUP" | "COMPLETED";
  emailVerified: boolean;
  profileCompleted: boolean;
  twoFACompleted: boolean;
  twoFAMethods: {
    phone: boolean;
    authenticator: boolean;
    backupCodes: boolean;
  };
};

type AuthState = {
  user: User;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  signupProgress: SignupProgress | null;
};

const initialState: AuthState = {
  user: null,
  status: "idle",
  error: null,
  signupProgress: null,
};

export const fetchProfile = createAsyncThunk("auth/fetchProfile", async () => {
  const res = await axiosClient.get("/auth/profile");
  return res.data?.response || res.data;
});

export const loginThunk = createAsyncThunk(
  "auth/login",
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      await axiosClient.post("/auth/login", { email, password });
      const res = await axiosClient.get("/auth/profile");
      return res.data?.response || res.data;
    } catch (err: any) {
      const payload = err?.response?.data?.response || err?.response?.data || { message: err?.message };
      if (typeof payload === "object") {
        payload.message = payload.message || err?.response?.data?.message || err?.message || "Login failed";
      }
      return rejectWithValue(payload);
    }
  }
);

export const logoutThunk = createAsyncThunk("auth/logout", async () => {
  await axiosClient.post("/auth/logout");
  return null;
});

// New signup thunks
export const initiateSignupThunk = createAsyncThunk(
  "auth/initiateSignup",
  async ({ email }: { email: string }, { rejectWithValue }) => {
    try {
      const res = await axiosClient.post("/auth/signup/initiate", { email });
      return res.data?.response || res.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err?.message || "Failed to initiate signup");
    }
  }
);

export const verifySignupEmailThunk = createAsyncThunk(
  "auth/verifySignupEmail",
  async ({ email, otp }: { email: string; otp: string }, { rejectWithValue }) => {
    try {
      const res = await axiosClient.post("/auth/signup/verify-email", { email, otp });
      return res.data?.response || res.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err?.message || "Failed to verify email");
    }
  }
);

export const setupProfileThunk = createAsyncThunk(
  "auth/setupProfile",
  async (
    { email, name, password, confirmPassword }: { email: string; name: string; password: string; confirmPassword: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosClient.post("/auth/signup/setup-profile", { email, name, password, confirmPassword });
      return res.data?.response || res.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err?.message || "Failed to setup profile");
    }
  }
);

export const setupPhone2FAThunk = createAsyncThunk(
  "auth/setupPhone2FA",
  async ({ email, phone_number }: { email: string; phone_number: string }, { rejectWithValue }) => {
    try {
      const res = await axiosClient.post("/auth/signup/setup-phone-2fa", { email, phone_number });
      return res.data?.response || res.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err?.message || "Failed to setup phone 2FA");
    }
  }
);

export const verifyPhone2FAThunk = createAsyncThunk(
  "auth/verifyPhone2FA",
  async ({ email, otp }: { email: string; otp: string }, { rejectWithValue }) => {
    try {
      const res = await axiosClient.post("/auth/signup/verify-phone-2fa", { email, otp });
      return res.data?.response || res.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err?.message || "Failed to verify phone 2FA");
    }
  }
);

export const setupAuthenticator2FAThunk = createAsyncThunk(
  "auth/setupAuthenticator2FA",
  async ({ email }: { email: string }, { rejectWithValue }) => {
    try {
      const res = await axiosClient.post("/auth/signup/setup-authenticator-2fa", { email });
      return res.data?.response || res.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err?.message || "Failed to setup authenticator 2FA");
    }
  }
);

export const verifyAuthenticator2FAThunk = createAsyncThunk(
  "auth/verifyAuthenticator2FA",
  async ({ email, token }: { email: string; token: string }, { rejectWithValue }) => {
    try {
      const res = await axiosClient.post("/auth/signup/verify-authenticator-2fa", { email, token });
      return res.data?.response || res.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err?.message || "Failed to verify authenticator 2FA");
    }
  }
);

export const generateBackupCodesThunk = createAsyncThunk(
  "auth/generateBackupCodes",
  async ({ email }: { email: string }, { rejectWithValue }) => {
    try {
      const res = await axiosClient.post("/auth/signup/generate-backup-codes", { email });
      return res.data?.response || res.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err?.message || "Failed to generate backup codes");
    }
  }
);

export const completeSignupThunk = createAsyncThunk(
  "auth/completeSignup",
  async ({ email }: { email: string }, { rejectWithValue }) => {
    try {
      const res = await axiosClient.post("/auth/signup/complete", { email });
      return res.data?.response || res.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err?.message || "Failed to complete signup");
    }
  }
);

export const getSignupProgressThunk = createAsyncThunk(
  "auth/getSignupProgress",
  async ({ email }: { email: string }, { rejectWithValue }) => {
    try {
      const res = await axiosClient.post("/auth/signup/progress", { email });
      return res.data?.response || res.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err?.message || "Failed to get signup progress");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
    clearSignupProgress(state) {
      state.signupProgress = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload || null;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to load profile";
        state.user = null;
      })
      .addCase(loginThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload || null;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Login failed";
        state.user = null;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.status = "idle";
      })
      // Signup flow handlers
      .addCase(initiateSignupThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(initiateSignupThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.signupProgress = action.payload;
      })
      .addCase(initiateSignupThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(verifySignupEmailThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.signupProgress = action.payload;
      })
      .addCase(verifySignupEmailThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(setupProfileThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.signupProgress = action.payload;
      })
      .addCase(setupProfileThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(setupPhone2FAThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
      })
      .addCase(setupPhone2FAThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(verifyPhone2FAThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
      })
      .addCase(verifyPhone2FAThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(setupAuthenticator2FAThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
      })
      .addCase(setupAuthenticator2FAThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(verifyAuthenticator2FAThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
      })
      .addCase(verifyAuthenticator2FAThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(generateBackupCodesThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
      })
      .addCase(generateBackupCodesThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(completeSignupThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload?.user || null;
        state.signupProgress = null;
      })
      .addCase(completeSignupThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(getSignupProgressThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.signupProgress = action.payload;
      })
      .addCase(getSignupProgressThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export const { setUser, clearSignupProgress } = authSlice.actions;
export default authSlice.reducer;

