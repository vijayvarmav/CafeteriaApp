import React, { useState, useEffect } from "react";
import {
  Autocomplete,
  Button,
  IconButton,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";

const App = () => {
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [forms, setForms] = useState([
    { selectedItems: [], selectedPerson: null },
  ]);
  const [statusMessage, setStatusMessage] = useState("");
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [openItemDialog, setOpenItemDialog] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemCost, setNewItemCost] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  // Dialog state
  const [openDeleteConfirmDialog, setOpenDeleteConfirmDialog] = useState(false);
  const [formToDeleteIndex, setFormToDeleteIndex] = useState(null);
  const [openResetConfirmDialog, setOpenResetConfirmDialog] = useState(false);

  // Fetch and sort users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("https://8v8x3g-5000.csb.app/users");
        const today = new Date()
          .toLocaleDateString("en-us", { weekday: "long" })
          .toLowerCase();
        const sortedUsers = response.data.sort(
          (a, b) => b.totalOrders[today] - a.totalOrders[today]
        );
        setUsers(sortedUsers);
      } catch (err) {
        console.log(err);
      }
    };
    fetchUsers();
  }, []);

  // Fetch and sort items based on selected user
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get("https://8v8x3g-5000.csb.app/item");
        const today = new Date()
          .toLocaleDateString("en-us", { weekday: "long" })
          .toLowerCase();
        const defaultItems = response.data.sort(
          (a, b) => b.dailyOrders[today] - a.dailyOrders[today]
        );
        if (selectedUser) {
          const user = users.find((user) => user.name === selectedUser);
          if (user && user.totalOrders[today] === 0) {
            setItems(defaultItems);
            return;
          }
          const responseSortedItems = await axios.post(
            "https://8v8x3g-5000.csb.app/items-sorted-by-user",
            {
              userName: selectedUser,
            }
          );
          setItems(responseSortedItems.data);
        } else {
          setItems(defaultItems);
        }
      } catch (err) {
        console.log(err);
      }
    };
    fetchItems();
  }, [selectedUser, users]);

  const userOptions = users
    .filter(
      (user) => !forms.some((form) => form.selectedPerson?.value === user.name)
    )
    .map((user) => ({
      label: user.name,
      value: user.name,
    }));

  const itemOptions = items.map((item) => ({
    label: item.itemName,
    value: item.itemName,
    cost: parseFloat(item.cost),
  }));

  const handleAddForm = () => {
    setForms([...forms, { selectedItems: [], selectedPerson: null }]);
  };

  const handleDeleteForm = (index) => {
    setFormToDeleteIndex(index);
    setOpenDeleteConfirmDialog(true);
  };

  const handleConfirmDeleteForm = () => {
    setForms(forms.filter((_, i) => i !== formToDeleteIndex));
    setOpenDeleteConfirmDialog(false);
  };

  const handleCancelDeleteForm = () => {
    setOpenDeleteConfirmDialog(false);
  };

  const handlePersonChange = (index, newValue) => {
    const newForms = [...forms];
    newForms[index].selectedPerson = newValue;
    setSelectedUser(newValue?.value || null);
    setForms(newForms);
  };

  const handleItemChange = (index, newValue) => {
    const newForms = [...forms];
    newForms[index].selectedItems = newValue;
    setForms(newForms);
  };

  const handleReset = () => {
    setOpenResetConfirmDialog(true);
  };

  const handleConfirmReset = async () => {
    try {
      // Call the reset endpoint
      await axios.post("https://8v8x3g-5000.csb.app/reset");
      setForms(
        forms.map((form) => ({
          ...form,
          selectedItems: [],
        }))
      );
      setStatusMessage("Data reset successfully!");
      setOpenResetConfirmDialog(false);
    } catch (err) {
      console.log(err);
      setStatusMessage("Error resetting data.");
    }
  };

  const handleCancelReset = () => {
    setOpenResetConfirmDialog(false);
  };

  const handleConfirmOrder = async () => {
    try {
      setStatusMessage("Processing...");

      // Update user orders
      const selectedUsers = forms
        .map((form) => form.selectedPerson?.value)
        .filter(Boolean);
      for (const user of selectedUsers) {
        const form = forms.find((f) => f.selectedPerson.value === user);
        for (const item of form.selectedItems) {
          await axios.post("https://8v8x3g-5000.csb.app/update-user-orders", {
            name: user,
            itemName: item.label,
          });
        }
      }

      // Update item orders
      const allSelectedItems = forms.flatMap((form) => form.selectedItems);
      for (const item of allSelectedItems) {
        await axios.post("https://8v8x3g-5000.csb.app/update-item-orders", {
          itemName: item.label,
        });
      }

      // Refresh data after confirming orders
      const responseUsers = await axios.get(
        "https://8v8x3g-5000.csb.app/users"
      );
      const sortedUsers = responseUsers.data.sort((a, b) => {
        const today = new Date()
          .toLocaleDateString("en-us", { weekday: "long" })
          .toLowerCase();
        return b.totalOrders[today] - a.totalOrders[today];
      });
      setUsers(sortedUsers);

      const responseItems = await axios.get("https://8v8x3g-5000.csb.app/item");
      const today = new Date()
        .toLocaleDateString("en-us", { weekday: "long" })
        .toLowerCase();
      const sortedItems = responseItems.data.sort(
        (a, b) => b.dailyOrders[today] - a.dailyOrders[today]
      );
      setItems(sortedItems);

      setStatusMessage("Order confirmed successfully!");

      // Reset forms after 2 seconds
      setTimeout(() => {
        setForms([{ selectedItems: [], selectedPerson: null }]);
        setStatusMessage("");
      }, 2000);
    } catch (err) {
      console.log(err);
      setStatusMessage("Error confirming order.");
    }
  };

  const handleOpenUserDialog = () => setOpenUserDialog(true);
  const handleCloseUserDialog = () => setOpenUserDialog(false);

  const handleOpenItemDialog = () => setOpenItemDialog(true);
  const handleCloseItemDialog = () => setOpenItemDialog(false);

  const handleAddUser = async () => {
    try {
      await axios.post("https://8v8x3g-5000.csb.app/users", {
        name: newUserName,
      });
      setNewUserName("");
      handleCloseUserDialog();
      const response = await axios.get("https://8v8x3g-5000.csb.app/users");
      const sortedUsers = response.data.sort((a, b) => {
        const today = new Date()
          .toLocaleDateString("en-us", { weekday: "long" })
          .toLowerCase();
        return b.totalOrders[today] - a.totalOrders[today];
      });
      setUsers(sortedUsers);
    } catch (err) {
      console.log(err);
    }
  };

  const handleAddItem = async () => {
    try {
      await axios.post("https://8v8x3g-5000.csb.app/item", {
        itemName: newItemName,
        cost: newItemCost,
      });
      setNewItemName("");
      setNewItemCost("");
      handleCloseItemDialog();
      const response = await axios.get("https://8v8x3g-5000.csb.app/item");
      const today = new Date()
        .toLocaleDateString("en-us", { weekday: "long" })
        .toLowerCase();
      const sortedItems = response.data.sort(
        (a, b) => b.dailyOrders[today] - a.dailyOrders[today]
      );
      setItems(sortedItems);
    } catch (err) {
      console.log(err);
    }
  };

  const calculateTotalCost = (items) => {
    return items.reduce((total, item) => total + item.cost, 0);
  };

  const calculateTotalQuantity = (items) => {
    return items.length;
  };

  const aggregateItems = (items) => {
    const itemMap = new Map();

    items.forEach((item) => {
      const existingItem = itemMap.get(item.label);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        itemMap.set(item.label, { ...item, quantity: 1 });
      }
    });

    return Array.from(itemMap.values());
  };

  const allSelectedItems = forms.flatMap((form) => form.selectedItems);
  const totalQuantity = calculateTotalQuantity(allSelectedItems);
  const totalPrice = calculateTotalCost(allSelectedItems);
  const aggregatedItems = aggregateItems(allSelectedItems);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <h1>Cafeteria Application</h1>
        <IconButton onClick={handleAddForm}>
          <AddCircleOutlineRoundedIcon
            sx={{ height: "30px", width: "30px", padding: "0px" }}
          />
        </IconButton>
        <Button onClick={handleReset}>Reset</Button>
      </div>

      {forms.map((form, index) => (
        <form
          key={index}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "5px",
            marginBottom: "10px",
          }}
        >
          <Autocomplete
            disablePortal
            id={`combo-box-user-${index}`}
            options={[...userOptions, { label: "Add New User", value: "" }]}
            value={form.selectedPerson}
            onChange={(event, newValue) => {
              if (newValue && newValue.value === "") {
                handleOpenUserDialog();
              } else {
                handlePersonChange(index, newValue);
              }
            }}
            sx={{ width: 300 }}
            renderInput={(params) => <TextField {...params} label="Person" />}
          />

          <Autocomplete
            multiple
            disablePortal
            id={`combo-box-item-${index}`}
            options={[...itemOptions, { label: "Add New Item", value: "" }]}
            value={form.selectedItems}
            onChange={(event, newValue) => {
              if (newValue && newValue.some((item) => item.value === "")) {
                handleOpenItemDialog();
              } else {
                handleItemChange(index, newValue);
              }
            }}
            getOptionLabel={(option) => option.label}
            sx={{ width: 300 }}
            renderInput={(params) => <TextField {...params} label="Order" />}
          />

          <TextField
            id={`outlined-read-only-input-${index}`}
            label="Total Cost"
            value={`${calculateTotalCost(form.selectedItems).toFixed(2)}`}
            InputProps={{
              readOnly: true,
            }}
          />

          <IconButton onClick={() => handleDeleteForm(index)}>
            <DeleteIcon
              sx={{ height: "30px", width: "30px", padding: "0px" }}
            />
          </IconButton>
        </form>
      ))}

      <TableContainer component={Paper} style={{ marginTop: "20px" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Items</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Price</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {aggregatedItems.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.label}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{`${(item.cost * item.quantity).toFixed(
                  2
                )}`}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell>
                <strong>Total Quantity</strong>
              </TableCell>
              <TableCell>{totalQuantity}</TableCell>
              <TableCell>
                <strong>Total Price</strong>
              </TableCell>
              <TableCell>{`${totalPrice.toFixed(2)}`}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={4} style={{ textAlign: "center" }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleConfirmOrder}
                >
                  Confirm Order
                </Button>
                {statusMessage && <p>{statusMessage}</p>}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* User Dialog */}
      <Dialog open={openUserDialog} onClose={handleCloseUserDialog}>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="User Name"
            fullWidth
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUserDialog}>Cancel</Button>
          <Button onClick={handleAddUser}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={openItemDialog} onClose={handleCloseItemDialog}>
        <DialogTitle>Create New Item</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Item Name"
            fullWidth
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Item Cost"
            type="number"
            fullWidth
            value={newItemCost}
            onChange={(e) => setNewItemCost(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseItemDialog}>Cancel</Button>
          <Button onClick={handleAddItem}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={openDeleteConfirmDialog} onClose={handleCancelDeleteForm}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <p>Are you sure you want to delete this form?</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDeleteForm}>Cancel</Button>
          <Button onClick={handleConfirmDeleteForm}>Confirm</Button>
        </DialogActions>
      </Dialog>

      {/* Reset Confirm Dialog */}
      <Dialog open={openResetConfirmDialog} onClose={handleCancelReset}>
        <DialogTitle>Confirm Reset</DialogTitle>
        <DialogContent>
          <p>Are you sure you want to reset all data?</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelReset}>Cancel</Button>
          <Button onClick={handleConfirmReset}>Confirm</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default App;
