import React, { useState, useEffect } from "react";
import CircularProgress from "@mui/material/CircularProgress";
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
  InputAdornment,
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
  const [loadingItems, setLoadingItems] = useState(false);
  const [mealType, setMealType] = useState("lunch");
  const [loading, setLoading] = useState(false);

  // Fetch and sort users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("https://z4kw6g-5000.csb.app/users");
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
      setLoadingItems(true);
      try {
        const response = await axios.get("https://z4kw6g-5000.csb.app/item", {
          params: { mealType: mealType }, // Add mealType here
        });
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
          } else {
            const responseSortedItems = await axios.post(
              "https://z4kw6g-5000.csb.app/items-sorted-by-user",
              { userName: selectedUser, mealType: mealType } // Add mealType here
            );
            setItems(responseSortedItems.data);
          }
        } else {
          setItems(defaultItems);
        }
      } catch (err) {
        console.log(err);
      } finally {
        setLoadingItems(false);
      }
    };

    fetchItems();
  }, [selectedUser, users, mealType]);

  const userOptions = users
    .filter(
      (user) => !forms.some((form) => form.selectedPerson?.value === user.name)
    )
    .map((user) => ({
      label: user.name,
      value: user.name,
    }));

  const itemOptions = loadingItems
    ? [] // Show empty or loading indicator
    : items.map((item) => ({
        label: item.itemName,
        value: item.itemName,
        cost: parseFloat(item.cost),
      }));

  const handleAddForm = () => {
    setForms((prevForms) => [
      { selectedItems: [], selectedPerson: null },
      ...prevForms,
    ]);
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
      await axios.post("https://z4kw6g-5000.csb.app/reset");
      setForms(
        forms.map((form) => ({
          ...form,
          selectedItems: [],
        }))
      );
      setStatusMessage("Data reset successfully!");
      setOpenResetConfirmDialog(false);

      setTimeout(() => {
        setStatusMessage("");
      }, 3000);
    } catch (err) {
      console.log(err);
      setStatusMessage("Error resetting data.");
    }
  };

  const handleCancelReset = () => {
    setOpenResetConfirmDialog(false);
  };

  const handleConfirmOrder = async () => {
    // Check for empty fields
    for (const form of forms) {
      if (!form.selectedPerson) {
        setStatusMessage("Please fill in the user field.");
        return;
      }
      if (form.selectedItems.length === 0) {
        setStatusMessage("Please fill in the item field.");
        return;
      }
    }

    try {
      setLoading(true); // Show the loader
      setStatusMessage(""); // Clear previous status messages

      // Prepare data for API calls
      const orders = forms.flatMap((form) => {
        return form.selectedItems.map((item) => ({
          userName: form.selectedPerson.value,
          itemName: item.label,
          mealType: mealType,
        }));
      });

      // Update user orders
      const userOrders = orders.map((order) =>
        axios.post("https://z4kw6g-5000.csb.app/update-user-orders", {
          name: order.userName,
          itemName: order.itemName,
        })
      );
      await Promise.all(userOrders);

      // Update item orders
      const itemOrders = orders.map((order) =>
        axios.post("https://z4kw6g-5000.csb.app/update-item-orders", {
          itemName: order.itemName,
          mealType: order.mealType,
        })
      );
      await Promise.all(itemOrders);

      // Refresh data after confirming orders
      const [responseUsers, responseItems] = await Promise.all([
        axios.get("https://z4kw6g-5000.csb.app/users"),
        axios.get("https://z4kw6g-5000.csb.app/item", {
          params: { mealType: mealType },
        }),
      ]);
      const today = new Date()
        .toLocaleDateString("en-us", { weekday: "long" })
        .toLowerCase();
      const sortedUsers = responseUsers.data.sort(
        (a, b) => b.totalOrders[today] - a.totalOrders[today]
      );
      const sortedItems = responseItems.data.sort(
        (a, b) => b.dailyOrders[today] - a.dailyOrders[today]
      );
      setUsers(sortedUsers);
      setItems(sortedItems);
    } catch (err) {
      console.log(err);
      setStatusMessage("Error confirming order.");
    } finally {
      setLoading(false);
      setStatusMessage("Order confirmed successfully!");
      // Reset forms after 2 seconds
      setTimeout(() => {
        setForms([{ selectedItems: [], selectedPerson: null }]);
        setStatusMessage("");
      }, 3000);
    }
  };

  const handleOpenUserDialog = () => setOpenUserDialog(true);
  const handleCloseUserDialog = () => setOpenUserDialog(false);

  const handleOpenItemDialog = () => setOpenItemDialog(true);
  const handleCloseItemDialog = () => setOpenItemDialog(false);

  const handleAddUser = async () => {
    try {
      await axios.post("https://z4kw6g-5000.csb.app/users", {
        name: newUserName,
      });
      setNewUserName("");
      handleCloseUserDialog();
      const response = await axios.get("https://z4kw6g-5000.csb.app/users");
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
      await axios.post("https://z4kw6g-5000.csb.app/item", {
        itemName: newItemName,
        cost: newItemCost,
        mealType: mealType, // Add mealType here
      });
      setNewItemName("");
      setNewItemCost("");
      handleCloseItemDialog();
      const response = await axios.get("https://z4kw6g-5000.csb.app/item", {
        params: { mealType: mealType }, // Add mealType here
      });
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
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="contained"
          onClick={() => setMealType("breakfast")}
          sx={{
            backgroundColor:
              mealType === "breakfast" ? "primary.main" : "grey.500",
            color: mealType === "breakfast" ? "white" : "text.disabled",
            "&:hover": {
              backgroundColor:
                mealType === "breakfast" ? "primary.dark" : "grey.700",
            },
          }}
        >
          Breakfast
        </Button>
        <Button
          variant="contained"
          onClick={() => setMealType("lunch")}
          sx={{
            backgroundColor: mealType === "lunch" ? "primary.main" : "grey.500",
            color: mealType === "lunch" ? "white" : "text.disabled",
            "&:hover": {
              backgroundColor:
                mealType === "lunch" ? "primary.dark" : "grey.700",
            },
          }}
        >
          Lunch
        </Button>
        <IconButton onClick={handleAddForm}>
          <AddCircleOutlineRoundedIcon
            sx={{ height: "30px", width: "30px", padding: "0px" }}
          />
        </IconButton>
      </div>

      {forms.map((form, index) => (
        <form
          key={index}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "start",
            gap: "0",
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
            getOptionLabel={(option) => option.label.substring(0, 3)} // Show only first 3 characters
            sx={{
              width: 100,
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Person"
                InputProps={{
                  ...params.InputProps,
                  sx: {
                    "& input": {
                      textOverflow: "ellipsis", // Ensure text is truncated with ellipsis
                      overflow: "hidden",
                    },
                  },
                }}
              />
            )}
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
            sx={{ width: 220, padding: 0 }} // Make autocomplete full width
            renderInput={(params) => (
              <TextField
                {...params}
                label="Order"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <InputAdornment position="end" sx={{ marginRight: "2px" }}>
                      {params.InputProps.endAdornment}
                    </InputAdornment>
                  ),
                  sx: {
                    "& input": {
                      paddingRight: "10px", // Adjust padding to reduce space between text and dropdown arrow
                    },
                  },
                }}
              />
            )}
          />

          <TextField
            id={`outlined-read-only-input-${index}`}
            label="Cost"
            value={`${calculateTotalCost(form.selectedItems).toFixed(2)}`}
            InputProps={{
              readOnly: true,
            }}
            sx={{
              width: 100,
            }}
          />

          <IconButton
            color="primary"
            aria-label="delete"
            onClick={() => handleDeleteForm(index)}
            sx={{ padding: "8px" }}
          >
            <DeleteIcon sx={{ width: "fit-content" }} />
          </IconButton>
        </form>
      ))}

      <TableContainer component={Paper} style={{ marginTop: "20px" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Items</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Unit Price</TableCell>
              <TableCell>Total Price</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {aggregatedItems.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.label}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{item.cost}</TableCell>
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
                <strong>Final Price</strong>
              </TableCell>
              <TableCell>{`${totalPrice.toFixed(2)}`}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={4} style={{ textAlign: "center" }}>
                {loading ? (
                  <CircularProgress sx={{ height: "5px", width: "5px" }} />
                ) : (
                  <>
                    <Button onClick={handleReset}>Reset</Button>

                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleConfirmOrder}
                    >
                      Confirm Order
                    </Button>
                    {statusMessage && <p>{statusMessage}</p>}
                  </>
                )}
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