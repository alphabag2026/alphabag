import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// 현재 adminAccounts 확인
const [rows] = await conn.execute('SELECT id, username, role, isActive FROM adminAccounts LIMIT 10');
console.log('현재 adminAccounts:', rows);

// admin 계정이 없거나 비밀번호가 다를 경우 재설정
const hash = await bcrypt.hash('admin321', 10);

if (rows.length === 0) {
  // 계정 없음 → 새로 생성
  await conn.execute(
    'INSERT INTO adminAccounts (username, passwordHash, role, isActive) VALUES (?, ?, ?, ?)',
    ['admin', hash, 'admin', 1]
  );
  console.log('✅ admin 계정 새로 생성 완료');
} else {
  // 기존 계정 비밀번호 강제 업데이트
  await conn.execute(
    'UPDATE adminAccounts SET passwordHash = ?, isActive = 1 WHERE username = ?',
    [hash, 'admin']
  );
  console.log('✅ admin 비밀번호 재설정 완료');
}

// 확인
const [updated] = await conn.execute('SELECT id, username, role, isActive FROM adminAccounts');
console.log('업데이트 후:', updated);

await conn.end();
process.exit(0);
