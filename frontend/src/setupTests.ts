import '@testing-library/jest-dom';

global.liff = {
  init: jest.fn(),
  getOS: jest.fn(),
  isInClient: jest.fn(),
  isLoggedIn: jest.fn(),
  login: jest.fn(),
  getProfile: jest.fn(),
  getIDToken: jest.fn(),
};
