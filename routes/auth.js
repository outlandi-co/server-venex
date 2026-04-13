router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ msg: "User not found" })

    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(400).json({ msg: "Wrong password" })

    /* 🔥 THIS IS THE FIX */
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" }
    )

    res.json({
      token,
      user: {
        username: user.username,
        role: user.role
      }
    })

  } catch (err) {
    res.status(500).json(err)
  }
})