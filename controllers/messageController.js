import { Chat } from "../models/chatModel.js";
import { Message } from "../models/messageModels.js";
import { User } from "../models/userModel.js";
export const sendMessage = async (req, res) => {
    const { content, chatId } = req.body;

    if (!content || !chatId) {
        return res.status(200).send({ msg: "Error occured" , isError:true});
    }
    var newMessage = {
        sender: req.user._id,
        content: content,
        chat: chatId
    }
    try {
        var message = await Message.create(newMessage);
        message = await message.populate('sender', 'name pic').execPopulate();
        message = await message.populate('chat').execPopulate();
        message = await User.populate(message, {
            path: 'chat.users',
            select: 'name pic email'
        });
        return res.status(200).json(message)
    } catch (error) {
        return res.status(500).json({ msg: "Error while Login",isError:true })
    }
}

export const allMessages = async (req, res) => {
    try {
        const messages = await Message.find({ chat: req.params.chatId }).populate(
            "sender", "name pic email"
        ).populate("chat");

        return res.json(messages)
    } catch (error) {
        return res.status(200).json({ msg: "Unable to fetch the Messages", isError: true })

    }
}