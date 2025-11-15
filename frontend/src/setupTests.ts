import '@testing-library/jest-dom';
import type { Liff } from '@liff/liff-types';

global.liff = ({
  init: jest.fn(),
  getOS: jest.fn(),
  isInClient: jest.fn(),
  isLoggedIn: jest.fn(),
  login: jest.fn(),
  getProfile: jest.fn(),
  getIDToken: jest.fn(),
} as Partial<Liff>) as Liff;
