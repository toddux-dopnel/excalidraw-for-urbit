import React from 'react';
import { Modal, Button } from 'react-bootstrap';

export default function ClearModal({ show, onConfirm, handleClose }) {
  return (
    <Modal size="lg" centered show={show}>
      <Modal.Header>
        <Modal.Title>Confirm Clear</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        This will clear the whole canvas. Are you sure?
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={handleClose}>
          Close
        </Button>
        <Button variant="outline-info" onClick={onConfirm}>
          Confirm
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
