const express = require("express");

const router = express.Router();
const User = require('../models/users');
const multer = require('multer');
const fs = require('fs');
const { type } = require("os");


var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./uploads");
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    },
});

var upload = multer({
    storage: storage
}).single("image");


router.post("/add", upload, (req, res) => {
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        image: req.file.filename,
    });
    user.save()
        .then(() => {
            req.session.message = {
                type: 'success',
                message: "User Added Successfully"
            }
        })
        .catch((err) => {
            res.json({ message: err.message, type: 'danger' });
        })
    res.redirect("/");
});

router.get("/", (req, res) => {
    User.find().then((users) => {
        res.render("index", {
            title: "Home Page",
            users: users,
        })
    })
        .catch(err => {
            res.json({ message: err.message })
        })


});


router.get("/add", (req, res) => {
    res.render("add_users", { title: "Add Users" });
});


router.get("/edit/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id);

        if (!user) {
            return res.redirect("/");
        }

        res.render("edit_users", {
            title: "Edit User",
            user: user,
        });
    } catch (error) {
        console.error("Error fetching user:", error);
        res.redirect("/");
    }
});


router.post("/update/:id", upload, async (req, res) => {
    const id = req.params.id;
    let new_image = "";

    try {
        if (req.file) {
            new_image = req.file.filename;
            try {
                if (req.body.old_image) {
                    fs.unlinkSync(`./uploads/${req.body.old_image}`);
                }
            } catch (err) {
                console.error("Error deleting old image:", err);
            }
        } else {
            new_image = req.body.old_image;
        }

        const updateData = {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: new_image,
        };

        const result = await User.findByIdAndUpdate(id, updateData, { new: true });

        if (!result) {
            req.session.message = {
                type: "danger",
                message: "User not found or update failed.",
            };
            return res.redirect("/");
        }

        req.session.message = {
            type: "success",
            message: "User Updated Successfully!",
        };
        res.redirect("/");
    } catch (error) {
        console.error("Error updating user:", error);
        req.session.message = {
            type: "danger",
            message: "Something went wrong.",
        };
        res.redirect("/");
    }
});


router.get("/delete/:id", async (req, res) => {
    const id = req.params.id;

    try {
        const result = await User.findByIdAndDelete(id);

        if (!result) {
            req.session.message = {
                type: "danger",
                message: "User not found!",
            };
            return res.redirect("/");
        }

        if (result.image) {
            try {
                fs.unlinkSync(`./uploads/${result.image}`);
            } catch (err) {
                console.error("Error deleting image:", err);
            }
        }

        req.session.message = {
            type: "info",
            message: "User deleted successfully!",
        };

        res.redirect("/");

    } catch (error) {
        console.error("Error deleting user:", error);
        req.session.message = {
            type: "danger",
            message: "Failed to delete user!",
        };
        res.redirect("/");
    }
});

module.exports = router;