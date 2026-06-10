import http from 'k6/http';
import { BASE_URL } from './config.js';

export function ensureStudentAccount(id) {
  // 🔥 register
  http.post(`${BASE_URL}/v1/auth/register/student`, JSON.stringify({
    id,
    password: "Password123!"
  }), {
    headers: { 'Content-Type': 'application/json' }
  });

  // 🔐 login
  return http.post(`${BASE_URL}/v1/auth/login`, JSON.stringify({
    id,
    password: "Password123!"
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export function login() {
  return http.post(`${BASE_URL}/v1/auth/login`, JSON.stringify({
    id: 'test_student_001',
    password: 'Password123!'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}