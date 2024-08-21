import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { Add, Remove, Edit, Delete } from '@mui/icons-material';

const App = () => {
  const [users, setUsers] = useState([]);
  const [lunchItems, setLunchItems] = useState([]);
  const [breakfastItems, setBreakfastItems] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [summary, setSummary] = useState([]);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newItem, setNewItem] = useState({
    itemName: '',
    cost: '',
    mealType: 'Lunch',
  });

  useEffect(() => {
    const initializeLocalStorage = () => {
      const initialData = {
        breakfastMenu: [
          { itemName: 'Idly', cost: 30 },
          { itemName: 'Dosa', cost: 40 },
          { itemName: 'Vada', cost: 50 },
          { itemName: 'Bonda', cost: 60 },
          { itemName: 'Upma', cost: 30 },
          { itemName: 'Poha', cost: 45 },
          { itemName: 'Chai', cost: 12 },
        ],
        lunchMenu: [
          { itemName: 'Veg Fried Rice', cost: 50 },
          { itemName: 'Egg Fried Rice', cost: 55 },
          { itemName: 'Chicken Fried Rice', cost: 60 },
          { itemName: 'Veg Thali', cost: 120 },
          { itemName: 'Chicken Thali', cost: 140 },
          { itemName: 'Roti', cost: 10 },
          { itemName: 'Butter Chicken', cost: 150 },
        ],
        users: [
          { name: 'Vijay' },
          { name: 'Ankush' },
          { name: 'Vivek' },
          { name: 'Sachin' },
          { name: 'Lasya' },
          { name: 'Raghavendra' },
        ],
      };

      if (!localStorage.getItem('breakfastMenu')) {
        localStorage.setItem(
          'breakfastMenu',
          JSON.stringify(initialData.breakfastMenu)
        );
      }
      if (!localStorage.getItem('lunchMenu')) {
        localStorage.setItem(
          'lunchMenu',
          JSON.stringify(initialData.lunchMenu)
        );
      }
      if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify(initialData.users));
      }
    };

    initializeLocalStorage();

    setUsers(JSON.parse(localStorage.getItem('users')));
    setBreakfastItems(JSON.parse(localStorage.getItem('breakfastMenu')));
    setLunchItems(JSON.parse(localStorage.getItem('lunchMenu')));
    setSummary(JSON.parse(localStorage.getItem('summary')) || []);
  }, []);

  const handleUserSelect = (user) => {
    const isSelected = selectedUsers.includes(user);
    const existingEntry = summary.find((order) => order.user === user);

    if (isSelected) {
      setSelectedUsers((prevSelectedUsers) =>
        prevSelectedUsers.filter((u) => u !== user)
      );
      if (selectedUsers.length === 1) {
        setSelectedItems([]);
      }
    } else {
      setSelectedUsers((prevSelectedUsers) => [...prevSelectedUsers, user]);
      setSelectedItems(existingEntry ? existingEntry.items : []);
    }
  };

  const handleItemSelect = (item) => {
    const existingItem = selectedItems.find(
      (i) => i.itemName === item.itemName
    );
    if (existingItem) {
      setSelectedItems(
        selectedItems.filter((i) => i.itemName !== item.itemName)
      );
    } else {
      setSelectedItems([...selectedItems, { ...item, quantity: 1 }]);
    }
  };

  const handleQuantityChange = (item, amount) => {
    const updatedItems = selectedItems
      .map((i) => {
        if (i.itemName === item.itemName) {
          const newQuantity = i.quantity + amount;
          if (newQuantity > 0) {
            return { ...i, quantity: newQuantity };
          } else {
            return null;
          }
        }
        return i;
      })
      .filter((i) => i !== null);

    setSelectedItems(updatedItems);
  };

  const handleConfirm = () => {
    if (selectedUsers.length > 0 && selectedItems.length > 0) {
      const newEntries = selectedUsers.map((user) => ({
        user,
        items: selectedItems,
        totalCost: selectedItems.reduce(
          (acc, item) => acc + item.cost * item.quantity,
          0
        ),
      }));

      const updatedSummary = summary.filter(
        (order) => !selectedUsers.includes(order.user)
      );
      const newSummary = [...updatedSummary, ...newEntries];
      localStorage.setItem('summary', JSON.stringify(newSummary));

      setSummary(newSummary);
      setSelectedUsers([]);
      setSelectedItems([]);
    }
  };

  const handleEdit = (user) => {
    const existingEntry = summary.find((order) => order.user === user);
    if (existingEntry) {
      setSelectedUsers([user]);
      setSelectedItems(existingEntry.items);
    }
  };

  const handleDelete = (user) => {
    const updatedSummary = summary.filter((order) => order.user !== user);
    localStorage.setItem('summary', JSON.stringify(updatedSummary));

    setSummary(updatedSummary);
    if (selectedUsers.includes(user)) {
      setSelectedUsers((prevSelectedUsers) =>
        prevSelectedUsers.filter((u) => u !== user)
      );
      if (selectedUsers.length === 1) {
        setSelectedItems([]);
      }
    }
  };

  const addUser = () => {
    if (newUserName.trim()) {
      const updatedUsers = [...users, { name: newUserName }];
      setUsers(updatedUsers);
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      setNewUserName('');
      setUserDialogOpen(false);
    }
  };

  const addItem = () => {
    if (newItem.itemName.trim() && newItem.cost && newItem.mealType) {
      const updatedItems =
        newItem.mealType === 'Lunch'
          ? [
              ...lunchItems,
              { itemName: newItem.itemName, cost: parseFloat(newItem.cost) },
            ]
          : [
              ...breakfastItems,
              { itemName: newItem.itemName, cost: parseFloat(newItem.cost) },
            ];

      if (newItem.mealType === 'Lunch') {
        setLunchItems(updatedItems);
        localStorage.setItem('lunchMenu', JSON.stringify(updatedItems));
      } else {
        setBreakfastItems(updatedItems);
        localStorage.setItem('breakfastMenu', JSON.stringify(updatedItems));
      }

      setNewItem({ itemName: '', cost: '', mealType: 'Lunch' });
      setItemDialogOpen(false);
    }
  };

  const totalUsers = summary.length;
  const totalItemsOrdered = summary.reduce(
    (acc, entry) =>
      acc + entry.items.reduce((sum, item) => sum + item.quantity, 0),
    0
  );
  const totalOrderValue = summary.reduce(
    (acc, entry) => acc + entry.totalCost,
    0
  );

  const getUserStatusColor = (user) => {
    return summary.some((entry) => entry.user === user) ? 'green' : 'gray';
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom align="center">
        Cafeteria App
      </Typography>
      <Grid container sx={{ padding: '5px' }}>
        <Grid item xs={3} sm={3}>
          <Paper
            elevation={3}
            style={{
              height: '70vh',
              overflowY: 'scroll',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography variant="h6" style={{ margin: 0 }}>
              Users
            </Typography>
            <List style={{ flexGrow: 1, margin: 0, padding: 0 }}>
              {users.map((user) => (
                <ListItem
                  key={user.name}
                  button
                  onClick={() => handleUserSelect(user.name)}
                  style={{ padding: 0 }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: getUserStatusColor(user.name),
                      margin: '0px',
                      marginLeft: '5px',
                      padding: '0px',
                    }}
                  ></span>
                  <Checkbox
                    checked={selectedUsers.includes(user.name)}
                    onChange={() => handleUserSelect(user.name)}
                  />
                  <ListItemText primary={user.name} style={{ margin: 0 }} />
                </ListItem>
              ))}
              <ListItem>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setUserDialogOpen(true)}
                  startIcon={<Add />}
                >
                  Add User
                </Button>
              </ListItem>
            </List>
          </Paper>
        </Grid>

        <Grid item xs={6} sm={6}>
          <Paper
            elevation={3}
            style={{
              height: '70vh',
              overflowY: 'scroll',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography variant="h6" style={{ margin: 0 }}>
              Lunch Menu
            </Typography>
            <List style={{ flexGrow: 1, margin: 0, padding: 0 }}>
              {lunchItems.map((item) => (
                <ListItem
                  key={item.itemName}
                  button
                  onClick={() => handleItemSelect(item)}
                  style={{ padding: 0 }}
                >
                  <Checkbox
                    checked={selectedItems.some(
                      (i) => i.itemName === item.itemName
                    )}
                    onChange={() => handleItemSelect(item)}
                  />
                  <ListItemText
                    primary={`${item.itemName} - $${item.cost}`}
                    style={{ margin: 0 }}
                  />
                </ListItem>
              ))}
            </List>
            <Typography variant="h6" style={{ margin: '10px 0 0 0' }}>
              Breakfast Menu
            </Typography>
            <List style={{ flexGrow: 1, margin: 0, padding: 0 }}>
              {breakfastItems.map((item) => (
                <ListItem
                  key={item.itemName}
                  button
                  onClick={() => handleItemSelect(item)}
                  style={{ padding: 0 }}
                >
                  <Checkbox
                    checked={selectedItems.some(
                      (i) => i.itemName === item.itemName
                    )}
                    onChange={() => handleItemSelect(item)}
                  />
                  <ListItemText
                    primary={`${item.itemName} - $${item.cost}`}
                    style={{ margin: 0 }}
                  />
                </ListItem>
              ))}
              <ListItem>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setItemDialogOpen(true)}
                  startIcon={<Add />}
                >
                  Add Item
                </Button>
              </ListItem>
            </List>
          </Paper>
        </Grid>

        <Grid item xs={3} sm={3}>
          <Paper
            elevation={3}
            style={{
              height: '70vh',
              overflowY: 'scroll',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
            }}
          >
            <Typography variant="h6" style={{ margin: 0 }}>
              Summary
            </Typography>
            <div style={{ flexGrow: 1, padding: 10 }}>
              {selectedUsers.length > 0 && (
                <>
                  <Typography variant="subtitle1" style={{ margin: '10px 0' }}>
                    Users: {selectedUsers.join(', ')}
                  </Typography>
                  {selectedItems.length > 0 && (
                    <List style={{ margin: 0, padding: 0 }}>
                      {selectedItems.map((item) => (
                        <ListItem key={item.itemName} style={{ padding: 0 }}>
                          <ListItemText
                            primary={`${item.itemName} - $${item.cost}`}
                            style={{ margin: 0 }}
                          />
                          <IconButton
                            onClick={() => handleQuantityChange(item, -1)}
                          >
                            <Remove />
                          </IconButton>
                          <Typography>{item.quantity}</Typography>
                          <IconButton
                            onClick={() => handleQuantityChange(item, 1)}
                          >
                            <Add />
                          </IconButton>
                        </ListItem>
                      ))}
                    </List>
                  )}
                  {selectedItems.length > 0 && (
                    <Typography
                      variant="subtitle1"
                      style={{ marginTop: '10px' }}
                    >
                      Total: $
                      {selectedItems.reduce(
                        (acc, item) => acc + item.cost * item.quantity,
                        0
                      )}
                    </Typography>
                  )}
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handleConfirm}
                    style={{ marginTop: '10px' }}
                  >
                    Confirm
                  </Button>
                </>
              )}
            </div>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <TableContainer
            component={Paper}
            elevation={3}
            style={{ marginTop: '20px', padding: 0 }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell style={{ width: '30%' }}>User</TableCell>
                  <TableCell style={{ width: '40%' }}>Items</TableCell>
                  <TableCell style={{ width: '15%' }}>Total Cost</TableCell>
                  <TableCell style={{ width: '15%' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {summary.map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell>{entry.user}</TableCell>
                    <TableCell>
                      {entry.items.map((i) => (
                        <div key={i.itemName}>
                          {i.itemName} x {i.quantity}
                        </div>
                      ))}
                    </TableCell>
                    <TableCell>${entry.totalCost}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEdit(entry.user)}>
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(entry.user)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={1} style={{ fontWeight: 'bold' }}>
                    Total Users: {totalUsers}
                  </TableCell>
                  <TableCell colSpan={1} style={{ fontWeight: 'bold' }}>
                    Total Items Ordered: {totalItemsOrdered}
                  </TableCell>
                  <TableCell colSpan={2} style={{ fontWeight: 'bold' }}>
                    Total Order Value: ${totalOrderValue}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* User Dialog */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)}>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="User Name"
            type="text"
            fullWidth
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
          <Button onClick={addUser} color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Item Dialog */}
      {/* Item Dialog */}
      <Dialog open={itemDialogOpen} onClose={() => setItemDialogOpen(false)}>
        <DialogTitle>Add New Item</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Item Name"
            type="text"
            fullWidth
            value={newItem.itemName}
            onChange={(e) =>
              setNewItem({ ...newItem, itemName: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Cost"
            type="number"
            fullWidth
            value={newItem.cost}
            onChange={(e) => setNewItem({ ...newItem, cost: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Meal Type"
            select
            fullWidth
            value={newItem.mealType}
            onChange={(e) =>
              setNewItem({ ...newItem, mealType: e.target.value })
            }
            SelectProps={{
              native: true,
            }}
          >
            <option value="Lunch">Lunch</option>
            <option value="Breakfast">Breakfast</option>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setItemDialogOpen(false)}>Cancel</Button>
          <Button onClick={addItem} color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default App;
