import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { deleteEntry } from './client';

export default function RemoveModal({
  deleteId,
  onSuccess,
  setError,
  handleClose,
}) {
  return (
    deleteId !== null && (
      <Modal size="lg" centered show={deleteId !== null}>
        <Modal.Header>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this drawing?</Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleClose}>
            Close
          </Button>
          <Button
            variant="outline-danger"
            onClick={() =>
              deleteEntry(
                deleteId,
                () => onSuccess(),
                () => setError('Deletion rejected'),
              )
            }
          >
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    )
  );
}
