'use client';

import { useState, useRef, useEffect } from 'react';
import { TextField, Button, Box, Stack, CircularProgress, Typography } from '@mui/material';
import ReactMarkdown from 'react-markdown';

export default function Home() {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: `Hi, I'm the Headstarter Customer Support Assistant! How may I help you today?`,
  }]);

  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formatResponse = (text) => {
    return text
      .replace(/(:\s+)/g, ':\n\n')  // new line after colons
      .replace(/(\d+)\.\s*/g, '\n\n$1. ')  // new line before numbers followed by a period
      .replace(/(\*\*)(?=\s)/g, ':\n\n')
  };

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;
    setIsLoading(true);

    setMessage('');
    setMessages((messages) => [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' },
    ]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([...messages, { role: 'user', content: message }]),
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let text = ""

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text = decoder.decode(value, { stream: true })
        const formattedText = formatResponse(text);
        console.log(formattedText)
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1]
          let otherMessages = messages.slice(0, messages.length - 1)
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + formattedText },
          ]
        })
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages((messages) => [
        ...messages,
        { role: 'assistant', content: "I'm sorry, but I encountered an error. Please try again later." },
      ])
    }
    setIsLoading(false)
  }

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const messageEndRef = useRef(null);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Box
        width="100%"
        height="80px"
        bgcolor="primary.main"
        color="white"
        p={2}
        textAlign="center"
        position="sticky"
        top={0}
        zIndex={1000}
      >
        <Typography variant="h5">Headstarter AI Chat Assistant</Typography>
      </Box>
      <Stack
        direction="column"
        width="1000px"
        height="700px"
        border="2px solid black"
        p={2}
        spacing={3}
      >
        <Stack
          direction="column"
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={message.role === 'assistant' ? 'flex-start' : 'flex-end'}
            >
              <Box
                bgcolor={message.role === 'assistant' ? 'primary.main' : 'secondary.main'}
                color="white"
                borderRadius={16}
                p={3}
              >
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </Box>
            </Box>
          ))}
          <div ref={messageEndRef} />
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Enter message"
            fullWidth
            value={message}
            onKeyPress={handleKeyPress}
            onChange={(e) => setMessage(e.target.value)}
            multiline
            rows={4}
          />
          <Button
            variant="contained"
            onClick={sendMessage}
            disabled={isLoading}
            endIcon={isLoading ? <CircularProgress size={24} /> : null}
          >
            {isLoading ? 'Sending' : 'Send'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}