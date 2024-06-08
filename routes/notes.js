const express = require('express');
const router = express.Router();
const Notes = require("../models/Notes")
const fetchuser = require("../middleware/fetchuser");
const { body, validationResult } = require('express-validator');


router.get('/fetchallnotes', fetchuser, async (req, res)=>{
    try{
        const notes = await Notes.find({user: req.user.id});
        res.json(notes);
    }catch(err){
        console.error(err.message);
        res.status(500).send("some error occured");
    }
})

router.post('/addnote', fetchuser, [
    body('title', 'Title must be 5 Char.').isLength({min:3}),
    body('description', 'Description must be 5 Char.').isLength({min:5})
], async (req, res)=>{
    try{
    const result = validationResult(req);

    if (!result.isEmpty()) {
        return res.status(400).json({ errors: result.array() });
    }

    const {title, description, tag} = req.body;

    const note = Notes({
        title, description, tag, user: req.user.id
    });

    const saveNote = await note.save();

    res.json(saveNote);

    }catch(err){
        console.error(err.message);
        res.status(500).send("some error occured");
    }
})

router.put('/updatenote/:id', fetchuser,  async (req, res)=>{
    try{
        const {title, description, tag} = req.body;
        const newNote = {};

        if(title){newNote.title = title};
        if(description){newNote.description = description};
        if(tag){newNote.tag = tag};

        let note = await Notes.findById(req.params.id);

        if(!note) {
            return res.status(404).send("Not found");
        }

        if(note.user.toString() !== req.user.id){
            return res.status(404).send("Not Allowed");
        }

        note = await Notes.findByIdAndUpdate(req.params.id, {$set: newNote}, {new: true})
        res.json(note);

    }catch(err){
        console.error(err.message);
        res.status(500).send("some error occured");
    }
})

router.delete('/deletenote/:id', fetchuser,  async (req, res)=>{
    try{

        let note = await Notes.findById(req.params.id);

        if(!note) {
            return res.status(404).send("Not found");
        }

        if(note.user.toString() !== req.user.id){
            return res.status(404).send("Not Allowed");
        }

        note = await Notes.findByIdAndDelete(req.params.id)
        res.json({"Success": "Note has been deleted.", note: note});

    }catch(err){
        console.error(err.message);
        res.status(500).send("some error occured");
    }
})

module.exports = router