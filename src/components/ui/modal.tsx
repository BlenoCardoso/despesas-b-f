import React from 'react'

export const Modal: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <div data-testid="modal">{children}</div>
}

export const ModalContent: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <div data-testid="modal-content">{children}</div>
}

export const ModalHeader: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <div data-testid="modal-header">{children}</div>
}

export const ModalBody: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <div data-testid="modal-body">{children}</div>
}

export const ModalFooter: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <div data-testid="modal-footer">{children}</div>
}

export default Modal
