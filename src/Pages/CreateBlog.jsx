import React, { useEffect, useRef, useState } from 'react';
import { Alert, AlertDescription, AlertIcon, Box, Button, Flex,
     Heading, Image, Text, useColorModeValue, 
     useDisclosure} 
from '@chakra-ui/react';
import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    AlertDialogCloseButton,
  } from '@chakra-ui/react'
  
import { MdAddPhotoAlternate } from 'react-icons/md';
import { app } from '../firebase';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';

export default function CreateBlog() {
    const { isOpen, onOpen, onClose } = useDisclosure()
    const cancelRef = useRef();

    const [files, setFile] = useState(null);
    const [error, setError] = useState(false);
    const [filesError, setFilesError] = useState(null);
    const fileRef = useRef();
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(false);
    const [success, setSuccess] = useState(false);
    const [blogData, setBlogData] = useState({imageUrl: [],
        title: '',
        postedBy: '',
        body: ''
    });

    const handleChange = (e) => {
        setBlogData({
            ...blogData,
            [e.target.id] : e.target.value
        });
    };

    const handleImagesUpload = (e) => {
        console.log('click');
        // checking if there is existing image and if images files ia greater than 3
        if (files.length > 0 && files.length + blogData.imageUrl.length < 2) {
          setUploadProgress(true);
          setFilesError(false);
    
          const storeImages = [];
          for (let i = 0; i < files.length; i++) {
            storeImages.push(getAllImagesUrls(files[i]));
          }
          // waiting for all the image to be stored inside the storeImages array
          Promise.all(storeImages).then((urls) => {
            // keeping the previous image and adding new images with concat method
            setBlogData({...blogData, imageUrl: blogData.imageUrl.concat(urls)})
            setFilesError(false);
            setUploadProgress(false);
    
          }).catch((error) => {
            setFilesError('Failed to upload Image (2mb max per image)');
            setUploadProgress(false);
          });
    
        }else{
          setFilesError('You can only upload 2 images per blog');
          setUploadProgress(false);
        }
      }
    
      const getAllImagesUrls = async (file) => {
        return new Promise((resolve, reject) => {
          const storage = getStorage(app);
    
          const fileName = new Date().getTime() + file.name;
    
          const storageRef = ref(storage, fileName);
    
          const uploadTask = uploadBytesResumable(storageRef, file);
    
          uploadTask.on('state_changed',(snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(progress);
          },
            (error) => {
              reject(error);
            }, () => {
              getDownloadURL(uploadTask.snapshot.ref).then((downloadURL)=> {
                resolve(downloadURL)
              })}
          )
          });
      }

    let title = useRef();
    let body = useRef();
    let postedBy = useRef();
    let date = useRef();

    const handleSubmit = async (e) => {
        e.preventDefault();

        const checkTitle = title.current.value === '';
        const checkBody = body.current.value === '';
        const checkPostedBy = postedBy.current.value === '';
        const checkDate = date.current.value === '';
        try {
            setLoading(true);

            if (checkTitle) {
                setError('Title is required!');
                setLoading(false);
                return;
            }
            if (checkPostedBy) {
                setError('Posted by is required!');
                setLoading(false);
                return;
            }
            if (checkBody) {
                setError('Body is required!');
                setLoading(false);
                return;
            }
            if (checkDate) {
                setError('Date is required!');
                setLoading(false);
                return;
            }

            const url = `https://lightcietechblogapi.onrender.com/api/blogs`;

            const res = await fetch(url, {
                method: 'POST',
                headers: {'Content-Type' : 'application/json'},
                body: JSON.stringify(blogData)
            });
        
            const data = await res.json();

            setError(false);
            setLoading(false);
            setSuccess(true);
            console.log('created');
        } catch (error) {
            setError(true);
            setLoading(false);
            setSuccess(false);
        }
    }

    const handleRemoveImage = (index) => {
        setBlogData({...blogData,
          imageUrl: blogData.imageUrl.filter((_, i) => i !== index)
        })
    }

  return (
    <Box my={'5rem'} maxW={{'2xl': '50%',xl: '70%',md: '80%', base: '97%'}} rounded={5} mx={'auto'} shadow={'md'} bg={'gray.800'} color={'gray.100'} p={{'2xl': 12,md: 8, base: 3}}>
        <Box>
            <Box mb={10}>
                <Heading textAlign={'center'} fontSize={30} fontWeight={500}>Create <span className="text-red-500">New </span>Blog</Heading>
            </Box>
            <form onSubmit={handleSubmit}>
                <Box className='grid grid-cols-1 md:grid-cols-2 place-content-center gap-5'>
                    <Box>
                        <Box width={'100%'}>
                            <input ref={title} onChange={handleChange} type="text" id='title' className='w-full py-3 bg-gray-200 text-black rounded-md px-4' placeholder='Blog title...'/>
                        </Box>
                        <Box width={'100%'} py={3}>
                            <input ref={postedBy} onChange={handleChange} type="text" id='postedBy' className='w-full py-3 bg-gray-200 text-black rounded-md px-4' placeholder='Posted by...'/>
                        </Box>
                        <Box color={useColorModeValue('black', 'white')} bg={useColorModeValue('gray.200', 'gray.800')} borderBottomWidth={1} borderColor={useColorModeValue('green.500', '')} py={1} px={2} rounded={5}>
                            <input type="date" ref={date} onChange={handleChange} id="date" placeholder="Select Date" className='bg-transparent border-0 text-sm font-normal outline-none w-[100%] my-2 rounded-[0px]'/>
                        </Box>
                        <Box mt={3} width={'100%'}>
                            <textarea ref={body} onChange={handleChange} id="body" className='h-[150px] p-3 bg-gray-200 text-black w-full rounded-md' placeholder='Blog body...'></textarea>
                        </Box>
                        {
                            error ? (
                                <Alert status='error' mt={2} rounded={5} color={'red.500'} fontWeight={500}>
                                    <AlertIcon />
                                    <AlertDescription>{error && error}</AlertDescription>
                                </Alert>
                            ) : ''
                        }
                    </Box>
                    <Box px={3}>
                        {
                            success ? (
                            <>
                                <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
                                <AlertDialogOverlay>
                                    <AlertDialogContent>
                                    <AlertDialogBody fontWeight={500}>
                                        Blog Posted Successfully
                                    </AlertDialogBody>
                                    <AlertDialogFooter>
                                        <Button ref={cancelRef} onClick={onClose} bg={useColorModeValue('red.500','red.400')} _hover={{bg: 'red.400'}} color={'white'}>
                                        Ok
                                        </Button>
                                    </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialogOverlay>
                                </AlertDialog>
                            </>
                            ) : ''
                        }
                    </Box>
                    <Box>
                        <Text color={useColorModeValue('white', 'gray.200')} pb={2} textAlign={'center'}><strong className='text-red-500'>Image: </strong><span className="font-normal text-gray-200">The first image will be the cover (max 2)</span></Text>
                        <Box w={{md:'350px', base: '350px'}} mx={'auto'}>
                            <Flex position={'relative'} justifyContent={'center'} alignItems={'center'} width={'100%'} height={'200px'} rounded={5} bg={'gray.200'}>
                            <input type="file" onChange={(e) => setFile(e.target.files)} 
                            ref={fileRef} className='outline-none border-0 hidden' 
                            id='imageUrl' accept='image/*' multiple/>
                            
                            <Box position={'absolute'}  onClick={() => fileRef.current.click()} cursor={'pointer'} color={'gray.800'}>
                                <MdAddPhotoAlternate className='text-3xl'/>
                            </Box>

                            <Box p={3}>
                                <Image maxW={'100%'} height={'180px'} rounded={5} src={blogData.imageUrl[0]}/>
                            </Box>
                            </Flex>
                            {
                                filesError ? (
                                    <Alert status='error' mt={2} rounded={5} color={'red.500'} fontWeight={500}>
                                        <AlertIcon />
                                        <AlertDescription>{filesError && filesError}</AlertDescription>
                                    </Alert>
                                ) : ''
                            }
                        </Box>
                        <Box>
                            {
                                blogData.imageUrl.length > 0 && blogData.imageUrl.map((url, index) => (
                                <Flex key={index} justifyContent={'space-between'} alignItems={'center'} width={'350px'} mx={'auto'} my={2} bg={useColorModeValue('gray.200', 'gray.800')} py={3} px={2} rounded={5}>
                                    <Box borderWidth={2} borderColor={'white'} rounded={5}>
                                        <Image src={url} maxW={'100px'} rounded={5}/>
                                    </Box>
                                    <Box>
                                        <Button onClick={() => handleRemoveImage(index)} fontSize={14} bg={useColorModeValue('gray.800', 'gray.700')} rounded={3} color={'red.500'}>Delete</Button>
                                    </Box>
                                </Flex>
                                ))
                            }
                        </Box>
                        <Flex mt={3} justifyContent={'center'}>
                            <Button type='button' disabled={uploadProgress} onClick={handleImagesUpload} bg={'gray.200'} _hover={{bg: useColorModeValue('gray.300')}} color={'black'} rounded={3}>
                                {
                                    uploadProgress ? 'Uploading' : 'Upload Image'
                                }
                            </Button>
                        </Flex>
                    </Box>
                </Box>
                <Flex justifyContent={'center'} mt={5}>
                    <Button type='submit' onClick={onOpen} width={'200px'} py={6} bg={'red.500'} _hover={{bg: useColorModeValue('red.400')}} color={'white'} className='uppercase'>
                        {
                            loading ? 'Loading...' : 'Create Blog'
                        }
                    </Button>
                </Flex>
            </form>
        </Box>
    </Box>
  )
}
