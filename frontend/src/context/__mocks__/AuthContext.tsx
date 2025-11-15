import React, { createContext, useContext } from 'react';

export const AuthContext = createContext(undefined);

export const useAuth = () => ({
  user: { UserId: 1, UserName: 'Test User', RoleId: 3, BranchId: 1 },
  token: 'test-token',
  login: jest.fn(),
  loginWithLine: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  isLoading: false,
});

export const AuthProvider = ({ children }) => <>{children}</>;
