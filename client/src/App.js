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
  Box,
} from "@mui/material";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import "./App.css";

const App = () => {
  const [currentItemFormIndex, setCurrentItemFormIndex] = useState(null);
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [breakfastItems, setBreakfastItems] = useState([]);
  const [lunchItems, setLunchItems] = useState([]);
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
  const [loadingBreakfast, setLoadingBreakfast] = useState(false);
  const [loadingLunch, setLoadingLunch] = useState(false);
  const [mealType, setMealType] = useState(" ");
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

  useEffect(() => {
    const fetchBreakfastItems = async () => {
      setLoadingBreakfast(true);
      try {
        const response = await axios.get("https://z4kw6g-5000.csb.app/item", {
          params: { mealType: "breakfast" },
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
            setBreakfastItems(defaultItems);
          } else {
            const responseSortedItems = await axios.post(
              "https://z4kw6g-5000.csb.app/items-sorted-by-user",
              { userName: selectedUser, mealType: "breakfast" }
            );
            setBreakfastItems(responseSortedItems.data);
          }
        } else {
          setBreakfastItems(defaultItems);
        }
      } catch (err) {
        console.log(err);
      } finally {
        setLoadingBreakfast(false);
      }
    };

    fetchBreakfastItems();
  }, [selectedUser, users]);

  useEffect(() => {
    const fetchLunchItems = async () => {
      setLoadingLunch(true);
      try {
        const response = await axios.get("https://z4kw6g-5000.csb.app/item", {
          params: { mealType: "lunch" },
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
            setLunchItems(defaultItems);
          } else {
            const responseSortedItems = await axios.post(
              "https://z4kw6g-5000.csb.app/items-sorted-by-user",
              { userName: selectedUser, mealType: "lunch" }
            );
            setLunchItems(responseSortedItems.data);
          }
        } else {
          setLunchItems(defaultItems);
        }
      } catch (err) {
        console.log(err);
      } finally {
        setLoadingLunch(false);
      }
    };

    fetchLunchItems();
  }, [selectedUser, users]);

  const userOptions = users
    .filter(
      (user) => !forms.some((form) => form.selectedPerson?.value === user.name)
    )
    .map((user) => ({
      label: user.name,
      value: user.name,
    }));

  const breakfastItemOptions = loadingBreakfast
    ? [] // Show empty or loading indicator
    : breakfastItems.map((item) => ({
        label: item.itemName,
        value: item.itemName,
        cost: parseFloat(item.cost),
      }));

  const lunchItemOptions = loadingLunch
    ? [] // Show empty or loading indicator
    : lunchItems.map((item) => ({
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
    if (newValue.some((item) => item.value === "")) {
      handleOpenItemDialog(); // Open dialog if "Add New Item" is selected
      return; // Exit function to prevent further processing
    }
    // Get the selected item and the previously selected items
    const previouslySelectedItems = forms[index].selectedItems;
    const newlySelectedItems = newValue;

    // Identify the removed items
    const removedItems = previouslySelectedItems.filter(
      (item) =>
        !newlySelectedItems.some((newItem) => newItem.value === item.value)
    );

    if (removedItems.length > 0) {
      // Handle item removal
      const newForms = [...forms];
      newForms[index].selectedItems = newlySelectedItems;
      setForms(newForms);
    } else if (newlySelectedItems.length > 0) {
      // Handle item addition
      setCurrentItem(newlySelectedItems[newlySelectedItems.length - 1]);
      setQuantity(1); // Default quantity
      setQuantityDialogOpen(true);
      setCurrentItemFormIndex(index);
    }
  };

  const handleQuantityChange = (event) => {
    setQuantity(Number(event.target.value));
  };

  const handleAddItemWithQuantity = () => {
    if (currentItem !== null) {
      const newForms = [...forms];
      const selectedForm = newForms[currentItemFormIndex]; // Use the correct form index

      // Add the item with the specified quantity
      selectedForm.selectedItems.push({ ...currentItem, quantity });

      setForms(newForms);
      setQuantityDialogOpen(false);
    }
  };

  const handleCloseQuantityDialog = () => {
    setQuantityDialogOpen(false);
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
        return form.selectedItems.map((item) => {
          // Determine meal type based on selected item
          const mealType = breakfastItemOptions.some(
            (bItem) => bItem.value === item.value
          )
            ? "breakfast"
            : lunchItemOptions.some((lItem) => lItem.value === item.value)
            ? "lunch"
            : "";

          return {
            userName: form.selectedPerson.value,
            itemName: item.label,
            mealType: mealType, // Set the determined meal type
          };
        });
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
          params: { mealType: "lunch" }, // Use correct meal type here
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
      // Create a new item object
      const newItem = {
        itemName: newItemName,
        cost: newItemCost,
        mealType: mealType?.type, // Make sure to use the correct mealType
      };

      // Send a request to add the item
      await axios.post("https://z4kw6g-5000.csb.app/item", newItem);

      // Clear the input fields
      setNewItemName("");
      setNewItemCost("");
      handleCloseItemDialog();

      // Optimistically update the breakfast or lunch items in local state
      setItems((prevItems) => [...prevItems, newItem]); // Add the new item to the items array

      // Update the local breakfast or lunch items based on meal type
      if (mealType?.type === "breakfast") {
        setBreakfastItems((prevItems) => [...prevItems, newItem]); // Add to breakfast items
      } else if (mealType?.type === "lunch") {
        setLunchItems((prevItems) => [...prevItems, newItem]); // Add to lunch items
      }

      // Optionally fetch the updated items based on the meal type (if necessary)
      const response = await axios.get("https://z4kw6g-5000.csb.app/item", {
        params: { mealType: mealType?.type }, // Make sure to pass the mealType.type
      });

      // Sort the items as before
      const today = new Date()
        .toLocaleDateString("en-us", { weekday: "long" })
        .toLowerCase();
      const sortedItems = response.data.sort(
        (a, b) => b.dailyOrders[today] - a.dailyOrders[today]
      );

      // Update the state with sorted items
      setItems(sortedItems);
    } catch (err) {
      console.log(err);
    }
  };

  const calculateTotalCost = (items) => {
    return items.reduce(
      (total, item) => total + (item.cost * item.quantity || 1),
      0
    );
  };

  const aggregateItems = (items) => {
    const itemMap = new Map();

    items.forEach((item) => {
      const existingItem = itemMap.get(item.label);
      if (existingItem) {
        existingItem.quantity += item.quantity || 1;
      } else {
        itemMap.set(item.label, { ...item, quantity: item.quantity || 1 });
      }
    });

    return Array.from(itemMap.values());
  };

  const calculateTotalQuantity = (items) => {
    return items.reduce((total, item) => total + (item.quantity || 0), 0);
  };

  const allSelectedItems = forms.flatMap((form) => form.selectedItems);
  const totalQuantity = calculateTotalQuantity(allSelectedItems);
  const totalPrice = calculateTotalCost(allSelectedItems);
  const aggregatedItems = aggregateItems(allSelectedItems);

  const mealOptions = [
    { label: "Breakfast", type: "breakfast" },
    { label: "Lunch", type: "lunch" },
  ];

  const getCurrentGroupedOptions = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours * 100 + minutes; // Convert to a time in HHMM format

    // Define the cutoff times

    const BreakfastStart = 400; // 4:00 AM
    const BreakfastEnd = 1130; // 11:30 AM

    let options = [];

    if (currentTime >= BreakfastStart && currentTime < BreakfastEnd) {
      // After 11:30 AM and before end of day
      options = [
        {
          title: "Breakfast Menu",
          items: breakfastItemOptions,
        },
        {
          title: "Lunch Menu",
          items: lunchItemOptions,
        },

        {
          title: "Add Item",
          items: [{ label: "Add New Item", value: "" }],
        },
      ];
    } else {
      options = [
        {
          title: "Lunch Menu",
          items: lunchItemOptions,
        },
        {
          title: "Breakfast Menu",
          items: breakfastItemOptions,
        },

        {
          title: "Add Item",
          items: [{ label: "Add New Item", value: "" }],
        },
      ];
    }

    return options;
  };
  const [groupedOptions, setGroupedOptions] = useState(
    getCurrentGroupedOptions()
  );
  useEffect(() => {
    setGroupedOptions(getCurrentGroupedOptions());
  }, [breakfastItems, lunchItems]);
  const handleItemRemove = (index, itemToRemove) => {
    const newForms = [...forms];
    const selectedForm = newForms[index];

    // Find the item in the selectedItems array
    const itemIndex = selectedForm.selectedItems.findIndex(
      (item) => item.value === itemToRemove.value
    );

    if (itemIndex !== -1) {
      // Reduce quantity or remove item if quantity is less than 1
      if (selectedForm.selectedItems[itemIndex].quantity > 1) {
        selectedForm.selectedItems[itemIndex].quantity -= 1;
      } else {
        selectedForm.selectedItems.splice(itemIndex, 1);
      }

      setForms(newForms);
    }
  };

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
        <IconButton onClick={handleAddForm}>
          <AddCircleOutlineRoundedIcon
            sx={{ height: "30px", width: "30px", padding: "0px" }}
          />
        </IconButton>
      </div>

      <TableContainer component={Paper} style={{ marginTop: "20px" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 20, padding: 0 }}>Person</TableCell>
              <TableCell sx={{ minWidth: 220, maxWidth: 220, padding: 0 }}>
                Food Item
              </TableCell>
              <TableCell sx={{ minWidth: 50, maxWidth: 50, padding: 0 }}>
                Cost
              </TableCell>
              <TableCell sx={{ width: 50, padding: 0 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {forms.map((form, index) => (
              <TableRow key={index}>
                <TableCell sx={{ width: 20, padding: 0 }}>
                  <Autocomplete
                    disablePortal
                    id={`combo-box-user-${index}`}
                    options={[
                      ...userOptions,
                      { label: "Add New User", value: "" },
                    ]}
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
                      width: "100%",
                      zIndex: 1300,
                      padding: 0,
                      "& .MuiAutocomplete-hasPopupIcon.MuiAutocomplete-hasClearIcon.css-8j5cdv-MuiAutocomplete-root .MuiOutlinedInput-root":
                        {
                          paddingRight: 0,
                        },
                      "& .MuiAutocomplete-hasPopupIcon.MuiAutocomplete-hasClearIcon.css-8j5cdv-MuiAutocomplete-root .MuiAutocomplete-inputRoot":
                        {
                          paddingRight: 0,
                        },
                    }} // Make autocomplete full width
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        InputProps={{
                          ...params.InputProps,
                          sx: {
                            "& input": {
                              textOverflow: "ellipsis", // Ensure text is truncated with ellipsis
                              overflow: "visible",
                              padding: 0, // Remove padding inside input
                            },
                            padding: 0, // Remove padding of the TextField itself
                          },
                          "& .MuiAutocomplete-hasPopupIcon.MuiAutocomplete-hasClearIcon.css-8j5cdv-MuiAutocomplete-root .MuiOutlinedInput-root":
                            {
                              paddingRight: 0,
                            },
                          "& .MuiAutocomplete-hasPopupIcon.MuiAutocomplete-hasClearIcon.css-8j5cdv-MuiAutocomplete-root .MuiAutocomplete-inputRoot":
                            {
                              paddingRight: 0,
                            },
                        }}
                      />
                    )}
                  />
                </TableCell>
                <TableCell sx={{ minWidth: 200, maxWidth: 200, padding: 0 }}>
                  <Autocomplete
                    multiple
                    disablePortal
                    id={`combo-box-item-${index}`}
                    options={groupedOptions.flatMap((group) =>
                      group.items.map((item) => ({
                        ...item,
                        group: group.title,
                        quantity: 1, // Default quantity
                      }))
                    )}
                    groupBy={(option) => option.group}
                    value={form.selectedItems}
                    onChange={(event, newValue) =>
                      handleItemChange(index, newValue)
                    }
                    getOptionLabel={(option) =>
                      `${option.label} (${option.quantity})`
                    }
                    sx={{
                      width: "100%",
                      zIndex: 1300,
                      padding: 0,
                      margin: 0,
                      overflowY: "auto",
                      maxHeight: "50px",
                      "& .MuiAutocomplete-tag": {
                        margin: 0,
                        padding: 0,
                        minWidth: "fit-content",
                        flexGrow: 1,
                        display: "flex",
                        justifyContent: "space-between",
                      },
                      "& .MuiChip-label": {
                        padding: "0",
                      },
                      "& .MuiAutocomplete-inputRoot": {
                        padding: 0,
                        margin: 0,
                      },
                      "& .MuiInputBase-input": {
                        padding: 0,
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        border: "none",
                      },
                      "& .MuiInputAdornment-root": {
                        padding: 0,
                      },
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <InputAdornment position="end" sx={{ padding: 0 }}>
                              {params.InputProps.endAdornment}
                            </InputAdornment>
                          ),
                          sx: {
                            "& input": {
                              paddingRight: 0,
                              paddingLeft: 0,
                              padding: 0,
                            },
                            padding: 0,
                          },
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <li
                        {...props}
                        style={{
                          padding: 0,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span>{`${option.label} (Qty: ${option.quantity})`}</span>
                        <IconButton
                          color="primary"
                          aria-label="remove"
                          onClick={(event) => {
                            event.stopPropagation(); // Prevent triggering any other events
                            handleItemRemove(index, option);
                          }}
                          sx={{ padding: "4px" }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </li>
                    )}
                    onDelete={(event, option) => {
                      // Handle item removal
                      handleItemChange(
                        index,
                        form.selectedItems.filter(
                          (item) => item.value !== option.value
                        )
                      );
                    }}
                  />
                </TableCell>
                <TableCell sx={{ width: 50, padding: 0 }}>
                  <TextField
                    id={`outlined-read-only-input-${index}`}
                    value={`${calculateTotalCost(form.selectedItems).toFixed(
                      2
                    )}`}
                    InputProps={{
                      readOnly: true,
                    }}
                    sx={{
                      width: "100%",
                      padding: 0,
                      "& .css-1t8l2tu-MuiInputBase-input-MuiOutlinedInput-input":
                        {
                          padding: "16px 0px",
                          textAlign: "center",
                        }, // Remove padding of the TextField itself
                    }}
                  />
                </TableCell>
                <TableCell sx={{ width: 50, padding: 0 }}>
                  <IconButton
                    color="primary"
                    aria-label="delete"
                    onClick={() => handleDeleteForm(index)}
                    sx={{ padding: "8px", margin: 0, color: "red" }} // Remove margin and padding
                  >
                    <DeleteIcon sx={{ width: "fit-content" }} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TableContainer component={Paper} style={{ marginTop: "20px" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell style={{ fontWeight: "bold" }}>Items</TableCell>
              <TableCell style={{ fontWeight: "bold" }}>Quantity</TableCell>
              <TableCell style={{ fontWeight: "bold" }}>Price</TableCell>
              <TableCell style={{ fontWeight: "bold" }}>Sum</TableCell>
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
            <TableRow style={{ textAlign: "center" }}>
              <TableCell style={{ textAlign: "center", fontSize: "16px" }}>
                <strong>Total Person:</strong> <span>{forms.length}</span>
              </TableCell>
              <TableCell style={{ textAlign: "center", fontSize: "16px" }}>
                <strong>Total Quantity:</strong> <span>{totalQuantity}</span>
              </TableCell>
              <TableCell style={{ textAlign: "center", fontSize: "16px" }}>
                <strong>Total Price:</strong>{" "}
                <span>{`${totalPrice.toFixed(2)}`}</span>
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell colSpan={4} style={{ textAlign: "center" }}>
                {loading ? (
                  <CircularProgress sx={{ height: "24px", width: "24px" }} />
                ) : (
                  <>
                    <Button
                      style={{
                        marginRight: "10px",
                        color: "red",
                        fontWeight: "500",
                      }}
                      onClick={() => {
                        setForms([{ selectedItems: [], selectedPerson: null }]);
                      }}
                    >
                      Reset
                    </Button>
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
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Button
          style={{ marginRight: "10px", color: "red", fontWeight: "700" }}
          onClick={handleReset}
        >
          Reset Database
        </Button>
      </Box>

      {/* User Dialog */}
      <Dialog open={quantityDialogOpen} onClose={handleCloseQuantityDialog}>
        <DialogTitle>Enter Quantity</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Quantity"
            type="number"
            fullWidth
            value={quantity}
            onChange={handleQuantityChange}
            inputProps={{ min: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseQuantityDialog}>Cancel</Button>
          <Button onClick={handleAddItemWithQuantity}>Add</Button>
        </DialogActions>
      </Dialog>

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
          <Autocomplete
            disablePortal
            id="combo-box-demo"
            options={mealOptions}
            sx={{ width: 300 }}
            renderInput={(params) => <TextField {...params} label="Meal" />}
            value={mealType} // Update this line to use the state correctlyddd
            onChange={(event, newValue) => {
              // Ensure newValue is being handled correctly
              if (newValue) {
                setMealType(newValue); // Set the selected meal type
              } else {
                setMealType(null); // Handle case where no value is selected
              }
            }}
            getOptionLabel={(option) => option.label || ""}
            isOptionEqualToValue={(option, value) =>
              option.label === value.label
            }
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
