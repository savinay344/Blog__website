const { Router } = require("express");
const multer = require("multer");
const path = require("path");

const Blog = require("../models/blog");
const Comment = require("../models/comment");

const router = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(`./public/uploads/`));
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });

router.get("/add-new", (req, res) => {
  return res.render("addBlog", {
    user: req.user,
  });
});

router.get("/:id", async (req, res) => {
  const blog = await Blog.findById(req.params.id).populate("createdBy");
  const comments = await Comment.find({ blogId: req.params.id }).populate(
    "createdBy"
  );

  return res.render("blog", {
    user: req.user,
    blog,
    comments,
  });
});

//Edit Blog
router.get("/edit/:id", async (req, res) => {
  const blog = await Blog.findById(req.params.id).populate("createdBy");
  const comments = await Comment.find({ blogId: req.params.id }).populate(
    "createdBy"
  );

  console.log({'eidtId': req.params.id});

  return res.render("editBlog", {
    user: req.user,
    blog,
    comments,
  });
});

router.post("/edit/:id", upload.single("coverImage"), async (req, res) => {
  const { title, body } = req.body;

  let imageurl = false;
  if(req.file){
    imageurl = true
  }

  await Blog.updateOne(
    { _id: req.params.id },
    {
      $set:
      {
        title: title,
        body: body,
        coverImageURL: imageurl?`/uploads/${req.file.filename}`:`/uploads/${req.body.firstimage}`
      }
    },
    { upsert: true }
  )
  return res.redirect(`/`);
});

router.post("/comment/:blogId", async (req, res) => {
  await Comment.create({
    content: req.body.content,
    blogId: req.params.blogId,
    createdBy: req.user._id,
  });
  return res.redirect(`/blog/${req.params.blogId}`);
});

router.post("/", upload.single("coverImage"), async (req, res) => {
  var imageurl = false;
  const { title, body } = req.body;
  if(req.file){
    imageurl = true
  }

  const blog = await Blog.create({
    body,
    title,
    createdBy: req.user._id,
    coverImageURL: imageurl?`/uploads/${req.file.filename}`:"",
  });
  return res.redirect(`/blog/${blog._id}`);
});

//Search Blog
router.post('/search', async(req, res) => {
  const {searchText} = req.body;

  console.log(searchText)


  Blog.find({}).then(blogs => {
    let searchArray =[];
    blogs.map(blog => {
      if(blog.title.toLowerCase().search(searchText.toLowerCase()) !== -1) {
        searchArray.push(blog)
      }
    })
    
    console.log(searchArray)
    return res.render("home",{
      searchText,
      sortMethod: "ALL",
      user: req.user,
      blogs: searchArray,
    })
  });
})

//Sort Blog
router.post('/sort', async(req, res) => {
  const {sort} = req.body;

  let sortArray = [];

  Blog.find({}).then(blogs => {
    blogs.map(blog => {
      sortArray.push(blog);
    })
    console.log(sortArray);
      if (sort == "_id") {

      } else if (sort == "title") {
        sortArray.sort(function(a,b) {
          return a.title.length - b.title.length;
        })
      } else if (sort == "createdAt") {
        sortArray.sort(function(a,b ) {
          return b.createdAt - a.createdAt;
        })
      }
      return res.render("home",{
        sortMethod: sort,
        searchText: "",
        user: req.user,
        blogs: sortArray,
      })
  })
  // Blog.find().sort(sort).exec((err, blog) => {
  //   return res.render("home",{
  //     sortMethod: sort,
  //     searchText: "",
  //     user: req.user,
  //     blogs: blog,
  //   })
  //   console.log(blog);
  // })


  
})


router.get("/delete/:id",async (req,res) => {
  console.log(req.params.id)
  await Blog.deleteOne({_id: req.params.id})
  return res.redirect('/');
})


module.exports = router;
