import React from 'react';
import { Card, Button } from 'react-bootstrap';

export default function Entry({ entry, name, onEdit }) {
  const { id, txt } = entry;
  return (
    <Card key={id}>
      <Card.Header className="fs-4 d-flex align-items-center justify-content-between">
        {name}
        <Button
          variant="warning"
          style={{ minWidth: '80px' }}
          onClick={() => onEdit(id, name, txt)}
        >
          Edit
        </Button>
      </Card.Header>
    </Card>
  );
}
