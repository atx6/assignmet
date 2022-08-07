const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = mongoose.model("User");
const Ticket = mongoose.model("Ticket");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const uuid = require("uuid");
const { JWT_SECRET } = require("../config/keys");
const requireLogin = require("../middleware/requireLogin");


// To signup a new user and return bearer token
router.post("/users/new", async (req, res) => {
  const { username, role } = req.body;
  if (!username || !role) {
    return res.status(422).json({ error: "Please fill all the fields" });
  }
  await User.findOne({ username: username }).then((savedUser) => {
    if (savedUser) {
      return res
        .status(422)
        .json({ error: "User with given username already exists" });
    }
    const user = new User({
      username: username,
      role: role,
    });
    user
      .save()
      .then((user) => {
        // res.json({message:"User Saved Successfully"})
        const token = jwt.sign({ _id: user._id }, JWT_SECRET);
        res.json({ token });
      })
      .catch((err) => {
        console.log(err);
      });
  });
});

// add new ticket
router.post("/tickets/new", requireLogin, async (req, res) => {
  const { title, description, status, priority, assignedTo } = req.body;
  const data = new Ticket({
    _id: uuid.v4(),
    title,
    description,
    status,
    priority,
    assignedTo
  });
  await data
    .save()
    .then((result) => {
      res.json({ details: result._id });
    })
    .catch((err) => {
      console.log(err);
    });
});

//show all tickets
router.get("/tickets/all", requireLogin, async (req, res) => {
  await Ticket.find()
    .populate(
      "detailOf",
      "_id title description status priority assignedTo createdAt"
    )
    .then((details) => {
      res.json({ details });
    })
    .catch((err) => {
      console.log(err);
    });
});

//show query tickets
router.get("/tickets/", requireLogin, async (req, res) => {
  const status = req.query.status;
  const title = req.query.title;
  const priority = req.query.priority;

  if (status) {
    await Ticket.find({ status: status })
      .populate(
        "detailOf",
        "_id title description status priority assignedTo createdAt"
      )
      .then((details) => {
        res.json({ details });
      })
      .catch((err) => {
        console.log(err);
      });
  } else if (title) {
    await Ticket.find({ title: title })
      .populate(
        "detailOf",
        "_id title description status priority assignedTo createdAt"
      )
      .then((details) => {
        res.json({ details });
      })
      .catch((err) => {
        console.log(err);
      });
  } else if (priority) {
    await Ticket.find({ priority: priority })
      .populate(
        "detailOf",
        "_id title description status priority assignedTo createdAt"
      )
      .then((details) => {
        res.json({ details });
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    res.json({ status: error });
  }
});

//delete ticket
router.post("/tickets/delete", requireLogin, async (req, res) => {
  const { ticketId } = req.body;
  if (req.user.role == "admin") {
    await Ticket.findByIdAndDelete(ticketId)
      .then((result) => {
        res.json({ deletedTicket: ticketId });
      })
      .catch((err) => {
        console.log(err);
      });
  } 
  else {
    res.json({ error: "Only admin can delete a ticket" });
  }
});

//close ticket
router.post("/tickets/markAsClosed", requireLogin, async (req, res) => {
  const { ticketId } = req.body;

  const ticket = await Ticket.findById(ticketId)
  .catch((err) => {
    console.log(err);
  });

  if (ticket) {
    if (req.user.role === "admin" || ticket.assignedTo == req.user.username) {
      await Ticket.find({ assignedTo: req.user.username, status: "open" })
        .populate(
          "detailOf",
          "_id title description status priority assignedTo createdAt"
        )
        .then((details) => {
          //check higher priority
          if (ticket.priority == "low") {
            let arr = [];
            details.forEach((detail) => {
              if(detail.priority != "low"){
                arr.push(detail);
                // console.log(detail);
              }
            });
            if(arr.length > 0){
              res.json({ error: "You cannot close this ticket" ,higherPriority : arr });
            }
            else{
              Ticket.findByIdAndUpdate(ticketId, { status: "close" })
              .catch((err) => {
                console.log(err);
              });
            }
          }
          else if (ticket.priority == "medium") {
            let arr = [];
            details.forEach((detail) => {
              if(detail.priority == "high"){
                arr.push(detail);
                // console.log(detail);
              }
            });
            if(arr.length > 0){
              res.json({ error: "You cannot close this ticket", higherPriority: arr });
            }
            else{
              Ticket.findByIdAndUpdate(ticketId, { status: "close" })
              .catch((err) => {
                console.log(err);
              });
            }
          } else {
            Ticket.findByIdAndUpdate(ticketId, { status: "close" })
              .then((result) => {
                res.json({ closedTicket: ticketId });
              })
              .catch((err) => {
                console.log(err);
              });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    // } else {
    //   res.json({ error: "Only admin or assigned user can update a ticket" });
    // }
  } 
  else {
    res.json({ error: "Ticket does not exist" });
  }
}
});

module.exports = router;
