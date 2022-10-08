import express from "express";
import { db } from "../../firebase-config.js";
import { v4 as uuidv4 } from 'uuid';
import { getDoc, collection, updateDoc, doc, addDoc, arrayUnion, arrayRemove, setDoc, deleteDoc, getDocs } from "firebase/firestore";
import { async } from "@firebase/util";

const router = express.Router();

router.get("/getAllPosts/", async (req, res) => {
    const posts = [];
    const querySnapshot = await getDocs(collection(db, "posts"));
    querySnapshot.forEach((doc) => {
        posts.push(doc.data());
    });
    res.send(posts);
});

router.get("/addPost/", async (req, res) => {
    console.log("Here");
    const { post, email, tags } = req.body;

    // const post = 'hello world';
    // const userId = uuidv4().toString();
    // const tags = ['#hello', '#world']
    const uuid = uuidv4().toString();
    const dateTime = new Date().toLocaleString().toString();
    await setDoc(doc(db, "posts", `${uuid}`), {
        message: post,
        userId: email,
        postId: uuid,
        time: dateTime,
    }).then(() => {
        res.send({ 'added': true });
    });

    const querySnapshot = await getDocs(collection(db, "tags"));
    const currTags = [];
    querySnapshot.forEach((doc) => {
        currTags.push(doc.id);
    });

    for (let i = 0; i < tags.length; i++) {
        const postRef = doc(db, "tags", `${tags[i]}`);
        if (currTags.includes(tags[i])) {
            await updateDoc(postRef, {
                posts: arrayUnion(uuid)
            });
        }
        else {
            await setDoc(postRef, {
                posts: arrayUnion(uuid)
            });
        }


    }
});

router.post("/getPostReplies/", async (req, res) => {
    const replies = [];
    const postId = req.body.postId;
    const querySnapshot = await getDocs(collection(db, "replies"));
    querySnapshot.forEach((doc) => {
        if (doc.data().postId === postId) {
            replies.push(doc.data());
        }
    });
    res.send(replies);
});

router.post("/addReply/", async (req, res) => {
    console.log("Here");
    const { reply, userId, postId } = req.body;
    const uuid = uuidv4().toString();
    const dateTime = new Date().toLocaleString().toString();
    await setDoc(doc(db, "posts", `${uuid}`), {
        message: reply,
        userId: userId,
        postId: uuid,
        reply: postId,
        time: dateTime,
    }).then(() => {
        res.send({ 'added': true });
    });
});

router.post("/like/", async (req, res) => {
    const likerId = "";
    const postId = "f90891bb-11e0-4ffc-b3c6-49a7f4ee347f";
    const postsSnapshot = await getDocs(collection(db, "posts"));
    const postRef = doc(db, "posts", `${postId}`);
    var isPostLiked = false;
    var isPostIn = false;
    postsSnapshot.forEach(async (doc) => {
        if (doc.data().postId === postId) {
            for (const like of doc.data().likes) {
                isPostIn = true;
                console.log(like);
                if (like === likerId) {
                    console.log("Here");
                    isPostLiked = true;
                    await updateDoc(postRef, {
                        likes: arrayRemove(likerId)
                    });
                    break;
                }
            }
        }
    });

    if (!isPostLiked && isPostIn) {
        await updateDoc(postRef, {
            likes: arrayUnion(likerId)
        });
    }

    const repliesSnapshot = await getDocs(collection(db, "replies"));
    const replyRef = doc(db, "replies", `${postId}`);
    var isReplyLiked = false;
    var isReplyIn = false;
    repliesSnapshot.forEach(async (doc) => {
        if (doc.data().postId === postId) {
            for (const like in doc.data().likes) {
                isReplyIn = true;
                if (like === likerId) {
                    isReplyLiked = true;
                    await updateDoc(replyRef, {
                        likes: arrayRemove(likerId)
                    });
                    break;
                }
            }
        }
    });

    if (!isReplyLiked && isReplyIn) {
        await updateDoc(replyRef, {
            likes: arrayUnion(likerId),
        });
    }

    res.send({ 'success': true });
});

export default router;

// http://10.199.39.26:5000/posts/getAllPosts