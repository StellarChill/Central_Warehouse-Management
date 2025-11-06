
import { Request, Response } from 'express';
import prisma from '../prisma';
import jwt from 'jsonwebtoken';
import axios from 'axios';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const LINE_CHANNEL_ID = process.env.LINE_CHANNEL_ID;

// ฟังก์ชันสำหรับ verify LINE access token
async function verifyLineToken(token: string) {
  try {
    const response = await axios.get('https://api.line.me/oauth2/v2.1/verify', {
      params: { access_token: token },
    });
    if (response.data.client_id !== LINE_CHANNEL_ID) {
      throw new Error('Invalid LINE channel ID');
    }
    return response.data; // { scope, client_id, expires_in }
  } catch (error) {
    console.error('Error verifying LINE token:', error);
    throw new Error('Invalid LINE token');
  }
}

// ฟังก์ชันสำหรับดึง user profile จาก LINE
async function getLineProfile(token: string) {
  try {
    const response = await axios.get('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data; // { userId, displayName, pictureUrl, statusMessage }
  } catch (error) {
    console.error('Error getting LINE profile:', error);
    throw new Error('Failed to get LINE profile');
  }
}

export async function lineLogin(req: Request, res: Response) {
  const { lineToken } = req.body;

  if (!lineToken) {
    return res.status(400).json({ error: 'LINE token is required' });
  }

  try {
    // 1. ตรวจสอบ Token
    await verifyLineToken(lineToken);

    // 2. ดึง Profile
    const lineProfile = await getLineProfile(lineToken);
    const { userId: lineUserId, displayName } = lineProfile;

    // 3. ค้นหาผู้ใช้ในระบบด้วย LineId
    let user = await prisma.user.findUnique({
      where: { LineId: lineUserId },
    });

    if (user) {
      // 4. ถ้าเจอผู้ใช้ -> ตรวจสอบสถานะ
      if (user.UserStatus !== 'ACTIVE') {
        return res.status(403).json({ error: 'Account not approved' });
      }

      // สร้าง JWT และส่งกลับเพื่อล็อกอิน
      const token = jwt.sign({ UserId: user.UserId, RoleId: user.RoleId }, JWT_SECRET, { expiresIn: '1d' });
      return res.json({
        token,
        user: {
          UserId: user.UserId,
          UserName: user.UserName,
          RoleId: user.RoleId,
          BranchId: user.BranchId,
        },
        isNewUser: false,
      });
    } else {
      // 5. ถ้าไม่เจอผู้ใช้ -> เป็นผู้ใช้ใหม่
      // ส่งข้อมูล line profile กลับไปให้ frontend เพื่อใช้ในหน้าลงทะเบียน
      return res.status(200).json({
        isNewUser: true,
        lineProfile: {
          LineId: lineUserId,
          UserName: displayName,
        },
      });
    }
  } catch (error: any) {
    return res.status(401).json({ error: error.message || 'LINE Login failed' });
  }
}
