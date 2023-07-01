import React, { useState } from 'react';
import { Card, Button, Form } from 'react-bootstrap';

export default function CreateEntry({ onCreate }) {
  const [drawingName, setDrawingName] = useState(null);
  return (
    <Card key={'createEntry'}>
      <Card.Header className="d-flex align-items-center justify-content-between">
        <Form.Control
          style={{ maxWidth: '500px', marginLeft: '-6px' }}
          type="text"
          placeholder="Write your drawing name here"
          onChange={(event) => {
            setDrawingName(event.target.value);
          }}
        />
        <Button
          style={{ minWidth: '80px' }}
          variant="success"
          disabled={!drawingName}
          onClick={() => {
            onCreate(drawingName);
          }}
        >
          Create
        </Button>
      </Card.Header>
    </Card>
  );
}
