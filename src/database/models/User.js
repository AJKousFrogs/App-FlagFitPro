// User Database Model
// Core user model for authentication and profile management

export class User {
  constructor(data = {}) {
    this.id = data.id || null;
    this.email = data.email || '';
    this.username = data.username || '';
    this.firstName = data.firstName || '';
    this.lastName = data.lastName || '';
    this.profileImage = data.profileImage || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.lastLogin = data.lastLogin || null;
  }

  // Get full name
  get fullName() {
    return `${this.firstName} ${this.lastName}`.trim() || this.username;
  }

  // Get display name
  get displayName() {
    return this.fullName || this.username || 'Anonymous User';
  }

  // User validation
  isValid() {
    return !!(this.email && this.username);
  }

  // Convert to plain object for API responses
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      username: this.username,
      firstName: this.firstName,
      lastName: this.lastName,
      profileImage: this.profileImage,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isActive: this.isActive,
      lastLogin: this.lastLogin,
      fullName: this.fullName,
      displayName: this.displayName
    };
  }

  // Create user from database row
  static fromDatabase(row) {
    return new User({
      id: row.id,
      email: row.email,
      username: row.username,
      firstName: row.first_name,
      lastName: row.last_name,
      profileImage: row.profile_image,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isActive: row.is_active,
      lastLogin: row.last_login
    });
  }

  // Convert to database format
  toDatabaseFormat() {
    return {
      email: this.email,
      username: this.username,
      first_name: this.firstName,
      last_name: this.lastName,
      profile_image: this.profileImage,
      is_active: this.isActive,
      last_login: this.lastLogin
    };
  }
}

// Export as both named and default export
export { User as default };