import React from 'react'
import { useState} from 'react'
import axios from 'axios'

import { useNavigate } from 'react-router-dom'

const SignUp = () => {

    const[Name,setName] = useState('')
    const[username,setUsername] = useState('')
    const[password,setPassword] = useState('')
    const[blank,setBlank] = useState()

    const navigate = useNavigate()

    const handleSubmit = async(e) => {
            e.preventDefault()
            try{
            const response = await axios.post('http://localhost:5000/creds',{Name,username,password});
            console.log(response);
            }
            catch(err){
                setBlank(500)
            }
            try{
            if(blank == 500){
                alert('fail')
            }else{
                alert('success')
                navigate('/')
                
            }}
            catch(err){
                console.log(err);
            }    
    }

    return(
        <div>
            <h1>Create User</h1>
            <form onSubmit={handleSubmit}>
                <label>Name</label> <br />
                <input required
                type="text"
                value={Name}
                onChange={(e)=>{
                    setName(e.target.value)
                }}
                /><br />
                <label>Username</label><br />
                <input required
                type="text"
                value={username}
                onChange={(e)=>{
                    setUsername(e.target.value)
                }}
                /><br />
                <label>Password</label><br />
                <input required
                type="password"
                value={password}
                onChange={(e)=>{
                    setPassword(e.target.value)
                }}
                /><br />
                <button type="submit">Sign Up</button>
            </form>
        </div>
    )
}

export default SignUp