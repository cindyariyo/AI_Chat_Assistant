'use client'
import { TextField, Button, Box, Stack } from '@mui/material';
import {systemPrompt} from '/app/api/chat/route.js'
//import { Stack } from '@mui/system';
import {useState, useRef, useEffect} from 'react'

export default function Home() {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: `Hi, I'm the Headstarter Customer Support Assistant! How may I help you today?`
  }])
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
 
  const sendMessage = async () => {
    if(!message.trim() || isLoading) return; // Dont send empty messages
    setIsLoading(true);

    setMessage('');
    setMessages((messages)=>[
      ...messages,
      {role:"user", content: message},
      {role:"assistant", content: ''}
    ])
    
  try {
    const response = fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
    "Authorization": `Bearer ${process.env.API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    "model": "meta-llama/llama-3.1-8b-instruct:free",
    "messages": [
      {"role": "system", "content": systemPrompt},
      {"role": 'user', "content": message}
    ],
  })
});
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
  
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
  
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1]
          let otherMessages = messages.slice(0, messages.length - 1)
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ]
        })
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages((messages) => [
        ...messages,
        { role: 'assistant', content: "Something went wrong. Please try again later." },
      ])
    } finally {
    setIsLoading(false);
    }
  }

  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  const messageEndRef = useRef(null);
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({behavior: 'smooth'})
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return( <Box 
          width={'100vw'} 
          height={'100vh'} 
          display={'flex'} 
          flexDirection='column'
          justifyContent={'center'}
          alignItems='center'
          >
            <Stack
              direction='column'
              width='600px'
              height='700px'
              border= '2px solid black'
              p={2}
              spacing={3}
              >
                <Stack
                  direction={'column'}
                  spacing={2}
                  flexGrow={1}
                  overflow='auto'
                  maxHeight={'100%'}
                  >
                    { messages.map((message,index) => (
                      <Box key={index} display='flex' justifyContent={
                        message.role === 'assistant' ? 'flex-start' : 'flex-end'
                      }><Box bgcolor={
                        message.role === 'assistant' ? 'primary.main' : 'secondary.main'
                      } 
                      color='white'
                      borderRadius={16}
                      p={3}>{message.content}</Box></Box>
                    ))}
                    <div ref={messageEndRef}/>
                  </Stack>
                  <Stack direction={'row'} spacing={2}>
                    <TextField
                      label='Enter message'
                      fullWidth
                      value={message}
                      onKeyPress = {handleKeyPress}
                      onChange = {(e) => setMessage(e.target.value)}></TextField>
                      <Button variant='contained' onClick={sendMessage} disabled={isLoading}>{isLoading ? "Sending": "Send"}</Button>
                  </Stack>
              </Stack>
          </Box>

  );
}
