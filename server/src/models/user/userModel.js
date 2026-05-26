// region imports
import mongoose from "mongoose";
import {
  hashPassword,
  verifyPassword,
  getFormattedDateTime,
} from "../../utils/common/commonFunctions.js";
// endregion

// region schema
const UserSchema = new mongoose.Schema(
  {
    User_Id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true,
    },

    Name: {
      type: String,
    },

    Email: {
      type: String,
    },

    Password: {
      type: String,
    },

    Role: {
      type: String,
      enum: ["ADMIN", "USER"],
      default: "USER",
    },

    Is_Verified: {
      type: Boolean,
      default: false,
    },

    TwoFA_Enabled: {
      type: Boolean,
      default: false,
    },

    TwoFA_Methods: {
      phone: {
        enabled: { type: Boolean, default: false },
        phone_number: String,
        verified: { type: Boolean, default: false },
      },
      authenticator: {
        enabled: { type: Boolean, default: false },
        secret: String,
        verified: { type: Boolean, default: false },
      },
      backup_codes: {
        enabled: { type: Boolean, default: false },
        codes: [
          {
            code: String,
            used: { type: Boolean, default: false },
            used_at: Date,
          },
        ],
      },
    },

    TwoFA_Setup_Status: {
      type: String,
      enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"],
      default: "NOT_STARTED",
    },

    // GitHub integration
    github_connected: {
      type: Boolean,
      default: false,
    },
    github_token: {
      type: String,
      default: null,
    },
    github_username: {
      type: String,
      default: null,
    },
    github_id: {
      type: Number,
      default: null,
    },
    github_connected_at: {
      type: Date,
      default: null,
    },

    Is_Deleted: {
      type: Number,
      default: 0,
    },

    Created_At: {
      type: String,
      default: () => getFormattedDateTime(),
    },

    Updated_At: {
      type: String,
      default: () => getFormattedDateTime(),
    },
  },
  {
    versionKey: false,
    timestamps: false,
  },
);
// endregion

// region indexes
UserSchema.index(
  { Email: 1 },
  { unique: true, partialFilterExpression: { Is_Deleted: 0 } },
);

UserSchema.index({ User_Id: 1 }, { unique: true });
UserSchema.index({ Role: 1, Is_Deleted: 1 });
UserSchema.index({ Name: 1, Is_Deleted: 1 });
UserSchema.index({ Created_At: -1, Is_Deleted: 1 });
// endregion

// region middleware
UserSchema.pre("save", async function () {
  if (this.isModified("Password")) {
    if (!this.Password?.startsWith("$argon2")) {
      this.Password = await hashPassword(this.Password || "");
    }
  }
  this.Updated_At = getFormattedDateTime();
});

UserSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate() || {};

  const pwd = update?.Password || update?.$set?.Password;
  if (pwd && !pwd.startsWith("$argon2")) {
    const hashed = await hashPassword(pwd || "");
    if (update?.Password) {
      update.Password = hashed;
    }
    if (update.$set?.Password) {
      update.$set.Password = hashed;
    }
  }

  if (!update.$set) {
    update.$set = {};
  }
  update.$set.Updated_At = getFormattedDateTime();
});
// endregion

// region methods
UserSchema.methods.comparePassword = async function (password = "") {
  return (await verifyPassword(password, this.Password || "")) || false;
};
// endregion

// region transforms
const transform = (doc, ret) => {
  if (ret) {
    delete ret.Password;
    delete ret.Is_Deleted;
    delete ret.github_token; // Never expose token to client
  }
  return ret;
};

UserSchema.set("toJSON", { transform });
UserSchema.set("toObject", { transform });
// endregion

// region model
const User = mongoose.model("User", UserSchema);
// endregion

// region exports
export default User;
// endregion
