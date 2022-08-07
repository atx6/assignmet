const mongoose = require('mongoose')
const uuid = require('uuid')
const ticket = new mongoose.Schema({
    _id: {
        type: String,
        default: uuid.v4,
        required: true
      },
      title: { type: String, required: true },
    description: { type: String, required: true },
      status: {
        type: String,
        enum: ["open", "close"],
        default: "open",
      },
      priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "low",
      },
      assignedTo: 
      { 
        type: String,
    },
      createdAt: { 
        type:Date,
        default: Date.now 
    }
})

mongoose.model("Ticket", ticket)