import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import FormUser from './FormUser';

test('shows a validation message when required fields are empty', () => {
  const formProps = {
    buttonColor: 'green',
    buttonSubmitTitle: 'Add',
    onUserAdded: jest.fn(),
    onUserUpdated: jest.fn(),
    server: '',
    socket: { emit: jest.fn() }
  };

  const { container } = render(<FormUser {...formProps} />);
  fireEvent.submit(container.querySelector('form'));

  expect(screen.getByText('Please fill out all fields: Name, Email, Age, and Gender.')).toBeInTheDocument();
  expect(formProps.onUserAdded).not.toHaveBeenCalled();
});