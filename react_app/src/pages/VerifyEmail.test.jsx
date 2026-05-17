import React from 'react';
import { screen } from '@testing-library/react';
import { auth } from '@/utils/firebase';
import { renderWithProviders } from '../__tests__/helpers/renderWithProviders';

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => jest.fn(),
  };
});

import VerifyEmail from './VerifyEmail';

afterEach(() => {
  auth.currentUser = null;
});

test('wrapper renders the VerifyEmail component for an unverified user', () => {
  auth.currentUser = { email: 'student@stu.kau.edu.sa', emailVerified: false };
  renderWithProviders(<VerifyEmail setUser={jest.fn()} />);

  expect(screen.getByText('verifyTitle')).toBeInTheDocument();
  expect(screen.getByText('student@stu.kau.edu.sa')).toBeInTheDocument();
});
