const express = require('express');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const UserActivityLog = require('../models/UserActivityLog');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../config/jwt');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * POST /api/auth/google
 * body: { idToken } - the Google ID token obtained client-side via Google Identity Services
 */
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'idToken is required' });

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ googleId });
    const isNewUser = !user;

    if (!user) {
      const role = getAdminEmails().includes(email.toLowerCase()) ? 'admin' : 'user';
      user = await User.create({
        googleId,
        fullName: name,
        email,
        profilePicture: picture,
        authProvider: 'google',
        role,
        lastLoginAt: new Date(),
        lastActiveAt: new Date(),
      });
    } else {
      if (!user.isActive) {
        return res.status(403).json({ error: 'Your account has been deactivated. Contact an administrator.' });
      }
      // Keep admin list in sync in case it changed after account creation
      const shouldBeAdmin = getAdminEmails().includes(email.toLowerCase());
      if (shouldBeAdmin && user.role !== 'admin') user.role = 'admin';
      user.lastLoginAt = new Date();
      user.lastActiveAt = new Date();
      user.profilePicture = picture;
      await user.save();
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    user.refreshTokenHash = hashToken(refreshToken);
    await user.save();

    await UserActivityLog.create({
      user: user._id,
      action: 'LOGIN',
      metadata: { isNewUser },
      ipAddress: req.ip,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePicture: user.profilePicture,
        role: user.role,
      },
      isNewUser,
    });
  } catch (err) {
    console.error('[auth/google]', err.message);
    res.status(401).json({ error: 'Google authentication failed' });
  }
});

/**
 * POST /api/auth/refresh
 * Reads refreshToken from httpOnly cookie, issues new access token.
 */
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });

    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.sub).select('+refreshTokenHash');
    if (!user || !user.isActive) return res.status(401).json({ error: 'Invalid session' });

    if (user.refreshTokenHash !== hashToken(refreshToken)) {
      return res.status(401).json({ error: 'Refresh token revoked' });
    }

    const accessToken = signAccessToken(user);
    res.json({ accessToken });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', requireAuth, async (req, res) => {
  req.user.refreshTokenHash = null;
  await req.user.save();
  res.clearCookie('refreshToken');
  res.json({ success: true });
});

/**
 * GET /api/auth/me
 */
router.get('/me', requireAuth, async (req, res) => {
  const u = req.user;
  res.json({
    id: u._id,
    fullName: u.fullName,
    email: u.email,
    profilePicture: u.profilePicture,
    role: u.role,
    favoriteTags: u.favoriteTags,
  });
});

module.exports = router;
