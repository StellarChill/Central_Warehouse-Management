import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import LiffRegisterPage from './LiffRegisterPage';
import BranchRequisitionCreatePage from './BranchRequisitionCreatePage.tsx';

// Mock the apiPost function
jest.mock('../lib/api', () => ({
  ...jest.requireActual('../lib/api'),
  apiPost: jest.fn(),
}));

// Mock import.meta.env
Object.defineProperty(global, 'import.meta', {
  value: {
    env: {
      VITE_API_URL: 'http://localhost:3000/api',
    },
  },
  writable: true,
});

const TestApp = ({ liffLoggedIn, profile, idToken }: { liffLoggedIn: boolean, profile?: any, idToken?: string }) => {
  (global.liff.isLoggedIn as jest.Mock).mockReturnValue(liffLoggedIn);
  (global.liff.getProfile as jest.Mock).mockResolvedValue(profile);
  (global.liff.getIDToken as jest.Mock).mockReturnValue(idToken);

  return (
    <MemoryRouter initialEntries={['/liff']}>
      <AuthProvider>
        <Routes>
          <Route path="/liff" element={<LiffRegisterPage />} />
          <Route path="/requisitions/create" element={<BranchRequisitionCreatePage />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('LiffRegisterPage', () => {
  it('should redirect to requisition create page after successful LINE login', async () => {
    const profile = { userId: 'test-user-id', displayName: 'Test User' };
    const idToken = 'test-id-token';
    const user = { UserId: 1, UserName: 'Test User', RoleId: 3, BranchId: 1 };

    (require('../lib/api').apiPost as jest.Mock).mockResolvedValue({ token: 'test-token', user });

    render(<TestApp liffLoggedIn={true} profile={profile} idToken={idToken} />);

    // Wait for the login process to complete and redirect
    await waitFor(() => {
      expect(screen.getByText('Create Requisition')).toBeInTheDocument();
    });
  });

  it('should show login button when user is not logged in to LIFF', async () => {
    render(<TestApp liffLoggedIn={false} />);

    // Wait for the component to render
    await waitFor(() => {
      expect(screen.getByText('Login with LINE')).toBeInTheDocument();
    });
  });
});
