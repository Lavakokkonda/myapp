import React, { useState, useEffect } from "react";
import { Table, Form, Button } from "react-bootstrap";
import * as XLSX from "xlsx";
import "./App.css";

const API_URL = "https://sheetdb.io/api/v1/ur6nmeux3x8s1";

const App = () => {
  const [formData, setFormData] = useState({ name: "", phone: "" });
  const [tableData, setTableData] = useState([]);
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  useEffect(() => {
    // Fetch data from Google Sheets API when the component mounts
    fetch(API_URL)
      .then((response) => response.json())
      .then((data) => setTableData(data))
      .catch((error) => console.error('Error fetching data from SheetDB:', error));
  }, []);

  useEffect(() => {
    localStorage.setItem("tableData", JSON.stringify(tableData));
  }, [tableData]);

  const getNextId = () => {
    const maxId = Math.max(...tableData.map((data) => data.id), 0);
    return maxId + 1;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
    if (name === "name") {
      setNameError("");
    } else if (name === "phone") {
      setPhoneError("");
    }
  };

  const handleEnterKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const inputs = document.getElementsByTagName("input");
      const currentIndex = Array.prototype.indexOf.call(inputs, e.target);
      const nextInput = inputs[currentIndex + 1];
      if (nextInput) {
        nextInput.focus();
      } else {
        handleAddToTable();
      }
    }
  };

  const handleAddToTable = () => {
    if (!formData.name || !formData.phone) {
      setNameError("Please fill in all fields.");
      setPhoneError("");
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      setNameError("");
      setPhoneError("Please enter a valid 10-digit mobile number.");
      return;
    }

    const capitalizedName = formData.name.toUpperCase();

    // Check if the phone number already exists in the tableData
    if (tableData.some((data) => data.phone === formData.phone)) {
      setNameError("");
      setPhoneError("Phone number must be unique.");
      return;
    }

    const newId = getNextId();

    fetch(API_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: [
          {
            id: newId,
            name: capitalizedName,
            phone: formData.phone,
          },
        ],
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data); // Log the response if needed
      })
      .catch((error) => {
        console.error("Error adding data to SheetDB:", error);
      });

    setTableData((prevData) => [
      ...prevData,
      { id: newId, name: capitalizedName, phone: formData.phone },
    ]);

    setFormData({ name: "", phone: "" });
    setNameError("");
    setPhoneError("");
    document.getElementsByName("name")[0].focus();
  };

  const handleDeleteRow = (index, id) => {
    const updatedTable = [...tableData];
    updatedTable.splice(index, 1);
    setTableData(updatedTable);

    // Send a DELETE request to remove the data from the SheetDB API
    fetch(`${API_URL}/id/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data); // Log the response if needed
      })
      .catch((error) => {
        console.error('Error deleting data from SheetDB:', error);
      });
  };

  const handleDownload = () => {
    const ws = XLSX.utils.json_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet 1");
    XLSX.writeFile(wb, "table_data.xlsx");
  };

  const handleCopyTable = () => {
    const tableString = tableData
      .map((data) => Object.values(data).join("\t"))
      .join("\n");
    navigator.clipboard.writeText(tableString);
  };

  return (
    <div className="container dark-theme">
      <Form className="mt-4">
        <Form.Group>
          <Form.Label>Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            onKeyPress={handleEnterKeyPress}
          />
          {nameError && <p className="error-message">{nameError}</p>}
        </Form.Group>

        <Form.Group>
          <Form.Label>Phone Number</Form.Label>
          <Form.Control
            type="tel"
            placeholder="Enter phone number"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            onKeyPress={handleEnterKeyPress}
          />
          {phoneError && <p className="error-message">{phoneError}</p>}
        </Form.Group>

        <Button
          variant="primary"
          onClick={handleAddToTable}
          className="mt-3 m-1"
        >
          Add to Table
        </Button>
        <Button
          variant="success"
          onClick={handleDownload}
          className="ml-2 mt-3 m-1"
        >
          Download
        </Button>
        <Button
          variant="info"
          onClick={handleCopyTable}
          className="ml-2 mt-3 m-1"
        >
          Copy 
        </Button>
      </Form>

      <Table striped bordered hover className="mt-4">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Phone Number</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {tableData
            .sort((a, b) => b.id - a.id) // Sort in descending order by ID
            .map((data, index) => (
              <tr key={index}>
                <td>{data.id}</td>
                <td>{data.name}</td>
                <td>{data.phone}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => handleDeleteRow(index, data.id)}
                  >
                    delete
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </Table>
    </div>
  );
};

export default App;
