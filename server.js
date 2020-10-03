const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')
var timeout = 10000;

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI , { useNewUrlParser: true, useUnifiedTopology: true })

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const { Schema } = mongoose;
const userSchema = new Schema({
    username:  {type:String,required:true}
});
const User = mongoose.model("User", userSchema);


app.post('/api/exercise/new-user',(req,res)=>{
  function newUser(done){
    console.log(req.body.username )
    User.findOne({ username: req.body.username },(err, user)=>{
      if(err) return done(err);
      if(user == null){
        user = User({username:req.body.username})
        user.save((err, user)=>{
          if(err) return done(err);
          done(null , user);
        })
      }
      else
        done(null , user);
    })

  }

  var t = setTimeout((res) => { 
    res.json({message: 'timeout'}) 
    }, timeout);
  
  newUser((err, data) =>{
    clearTimeout(t);
    if(err){
      console.log(err)
      res.json({"error":err})
    }
    else
      res.json({_id:data._id,username:data.username})
  })
})

app.get('/api/exercise/users',(req,res)=>{
  function users(done){
    User.find({},(err,user)=>{
      if(err) return done(err);
      done(null , user);
    })
  }
  
  var t = setTimeout((res) => { 
  res.json({message: 'timeout'}) 
  }, timeout);

  users((err,data)=>{
    clearTimeout(t);
    if(err){
      console.log(err)
      res.json({"error":err})
    }
    else
      res.json(data)
  })
})

const userExerciseSchema = new Schema({
    userId:  {type:String,required:true},
    description: {type:String,required:true},
    duration: {type:Number,required:true},
    date: { type: Date, default: Date.now }
});
const UserExercise = mongoose.model("UserExercise", userExerciseSchema);

app.post('/api/exercise/add',(req,res)=>{
  function addExercise(done){
    User.findById(req.body.userId,(err, user)=>{
      if(err) return done(err);
      if(user !== null){
        const obj= {userId:req.body.userId,description:req.body.description,duration:req.body.duration}
        req.body.date?obj.date=req.body.date:""
        const userExercise = UserExercise(obj)
        userExercise.save((err, data)=>{
          if(err) return done(err);
          console.log(data)
          done(null , {_id:req.body.userId,username:user.username,date:data.date.toDateString(),duration:data.duration,description:data.description});
        })
      }
      else
        done(null , user);
    })
  }

  var t = setTimeout((res) => { 
  res.json({message: 'timeout'}) 
  }, timeout);

  addExercise((err,data)=>{
    clearTimeout(t);
    if(err){
      console.log(err)
      res.json({"error":err})
    }
    else{
      if(data==null)
        res.send("Unknown userId")
      else{
        console.log(data)
        res.json(data)
      }
        
    }  
  })
})

app.get('/api/exercise/log',(req,res)=>{
  function log(done){
    User.findById(req.query.userId,(err, user)=>{
      if(err) return done(err);
      if(user !== null){
        UserExercise.find({userId:req.query.userId},{ description: 1, duration: 1 ,date:1,_id:0},(err, exercise)=>{
          if(err) return done(err);
          let exer = []
          for(let e of exercise){
            exer.push({description:e.description,duration:e.duration,date:e.date.toDateString()})
          }
          console.log(exercise)
          done(null , {_id:req.query.userId,username:user.username,count:exercise.length,log:exer})
        })
      }
      else
        done(null , user);
    })
  }

  var t = setTimeout((res) => { 
  res.json({message: 'timeout'}) 
  }, timeout);

  log((err,data)=>{
    clearTimeout(t);
    if(err){
      console.log(err)
      res.json({"error":err})
    }
    else{
      if(data==null)
        res.send("Unknown userId")
      else{
        //console.log(data)
        res.json(data)
      }
        
    }  
  })
})

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})