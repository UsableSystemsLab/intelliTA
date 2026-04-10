import { User } from "../models/index.js";
import { S3_PUBLIC_URL, S3_BUCKET } from "../configs/s3.js";

const UserController = {
  /**
   * @swagger
   * /users:
   *   post:
   *     security:
   *      - bearerAuth: []
   *     summary: Create a new user
   *     description: Create a new user with the provided information.
   *     tags: [Users]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/User'
   *     responses:
   *       201:
   *         description: User created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       400:
   *         description: Bad request
   */
  async createUser(req, res) {
    try {
      const { firebaseId, first_name, last_name, email } = req.body;
      const newUser = await User.create({
        firebaseId,
        first_name,
        last_name,
        email,
      });
      res.status(201).json(newUser);
    } catch (error) {
      res
        .status(400)
        .json({ message: "Error creating user", error: error.message });
    }
  },

  /**
   * @swagger
   * /users:
   *   get:
   *     security:
   *       - bearerAuth: []
   *     summary: Get all users
   *     description: Retrieve a list of all users.
   *     tags: [Users]
   *     responses:
   *       200:
   *         description: A list of users
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/User'
   *       500:
   *         description: Error fetching users
   */
  async getAllUsers(req, res) {
    try {
      const users = await User.findAll();
      res.status(200).json(users);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching users", error: error.message });
    }
  },

  /**
   * @swagger
   * /users/{id}:
   *   get:
   *     security:
   *       - bearerAuth: []
   *     summary: Get user by ID
   *     description: Retrieve a user by their unique ID.
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The user ID
   *     responses:
   *       200:
   *         description: A user object
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       404:
   *         description: User not found
   */
  async getUserById(req, res) {
    try {
      const user = await User.findByPk(req.params.id);
      if (user) {
        res.status(200).json(user);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching user", error: error.message });
    }
  },

  /**
   * @swagger
   * /users/{id}:
   *   put:
   *     security:
   *       - bearerAuth: []
   *     summary: Update user by ID
   *     description: Update the information of an existing user by their ID.
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The user ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/User'
   *     responses:
   *       200:
   *         description: User updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       400:
   *         description: Bad request
   *       404:
   *         description: User not found
   */
  async updateUser(req, res) {
    try {
      const [updated] = await User.update(req.body, {
        where: { id: req.params.id },
      });
      if (updated) {
        const updatedUser = await User.findByPk(req.params.id);
        res.status(200).json(updatedUser);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      res
        .status(400)
        .json({ message: "Error updating user", error: error.message });
    }
  },

  /**
   * @swagger
   * /users/{id}:
   *   delete:
   *     security:
   *       - bearerAuth: []
   *     summary: Delete user by ID
   *     description: Delete an existing user by their ID.
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The user ID
   *     responses:
   *       204:
   *         description: User deleted successfully
   *       404:
   *         description: User not found
   */
  async deleteUser(req, res) {
    try {
      const deleted = await User.destroy({
        where: { id: req.params.id },
      });
      if (deleted) {
        res.status(204).send("User deleted");
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error deleting user", error: error.message });
    }
  },

  /**
   * @swagger
   * /users/{firebaseUid}/deactivate:
   *   patch:
   *     security:
   *       - bearerAuth: []
   *     summary: Soft delete (deactivate) a user account
   *     description: Sets deleted_at timestamp on the user record instead of permanently deleting it.
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: firebaseUid
   *         required: true
   *         schema:
   *           type: string
   *         description: The Firebase UID of the user
   *     responses:
   *       200:
   *         description: Account deactivated successfully
   *       404:
   *         description: User not found
   */
  async deactivateAccount(req, res) {
    try {
      const [updated] = await User.update(
        { deleted_at: new Date() },
        { where: { firebaseId: req.params.firebaseUid, deleted_at: null } },
      );
      if (updated) {
        res.status(200).json({ message: "Account deactivated successfully" });
      } else {
        res.status(404).json({ message: "User not found or already deactivated" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error deactivating account", error: error.message });
    }
  },

  async uploadAvatar(req, res) {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const photoURL = S3_PUBLIC_URL
      ? `${S3_PUBLIC_URL}/${S3_BUCKET}/${req.file.key}`
      : req.file.location;

    await User.update(
      { photo_url: photoURL },
      { where: { firebaseId: req.params.firebaseUid } }
    );

    res.status(200).json({ photoURL });
  },

  async getProfile(req, res) {
    try {
      const user = await User.findOne({
        where: { firebaseId: req.params.firebaseUid },
        attributes: ["bio", "first_name", "last_name", "email", "github_username"],
      });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json(user);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching profile", error: error.message });
    }
  },

  async updateProfile(req, res) {
    try {
      const { bio, first_name, last_name, github_username } = req.body;
      const updateData = {};
      if (bio !== undefined) updateData.bio = bio;
      if (first_name !== undefined) updateData.first_name = first_name;
      if (last_name !== undefined) updateData.last_name = last_name;
      if (github_username !== undefined) updateData.github_username = github_username;

      const [updated] = await User.update(updateData, {
        where: { firebaseId: req.params.firebaseUid },
      });
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      const updatedUser = await User.findOne({
        where: { firebaseId: req.params.firebaseUid },
        attributes: ["bio", "first_name", "last_name", "email", "github_username"],
      });
      res.status(200).json(updatedUser);
    } catch (error) {
      res
        .status(400)
        .json({ message: "Error updating profile", error: error.message });
    }
  },
};

export default UserController;
