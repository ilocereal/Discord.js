import {GuildMember, Message} from "discord.js";
import {handleFailedCommand} from "../../embeds/commands/commandExceptionEmbed";
import {gb} from "../../misc/Globals";
import InfractionHandler from "../../handlers/internal/infractions/InfractionHandler";
import safeSendMessage from "../../handlers/safe/SafeSendMessage";
import {Command} from "../../handlers/commands/Command";
import {ArgType} from "../../decorators/expects";
import {UserPermissions} from "../../handlers/commands/command.interface";
import successEmbed from "../../embeds/commands/successEmbed";
import {randomRuntimeError} from "../../interfaces/Replies";

export async function strike(message: Message, input: [GuildMember, number, string]) {
    const [target, weight, reason] = input;

    if (target.id === target.guild.me.id) {
        return safeSendMessage(
            message.channel, {file: 'assets/misc/counterspell.png'}
        );
    }
    else if (target.id === gb.ownerID) {
        return handleFailedCommand(
            message.channel, `${weight ? 'strike' : 'warn'} senpai? But I don't want him to spank me again...`
        );
    }

    let banned;
    try {
        banned = await InfractionHandler.getInstance().addInfraction(message, message.member, target, reason, weight);
    } catch (err) {
        if (err.message === `TARGET_NOT_BANNABLE`){
            return handleFailedCommand(message.channel, `Striking this member would result in them getting banned but I can't ban that member.`);
        } else if (err.message === `EVENT_CANCELLED`){
            return;
        }
        return handleFailedCommand(message.channel, randomRuntimeError());

    }

    let output: string;

    if (banned) {
        output = `Banned ${target.user.username}.`;
    } else {
        output = `Infracted ${target.user.username} with weight **${weight}**.`;
    }

    const embed = successEmbed(message.member, output);
    return safeSendMessage(message.channel, embed);
}

async function run(message: Message, input: [GuildMember, number, string]): Promise<any> {
    strike(message, input);
}

export const command: Command = new Command(
    {
        names: ['strike'],
        info:
        'Warns or strikes a user, adding to their current strike count.\n' +
        "The target user notified DM'd **anonymously**, without exposing the striking moderator." +
        "If current strike count reaches or goes over the maximum limit (3 by default) and I have ban permissions, " +
        "the user is banned after a confirmation message.",
        usage: '{{prefix}}strike { member } { weight } { reason }',
        examples: [
            "{{prefix}}strike @Xetera 1 Don't be rude to other people.",
            "{{prefix}}strike 140862798832861184 3 You suck, you're banned."
        ],
        category: 'Moderation',
        expects: [
            {type: ArgType.Member, options: {strict: true}},
            [{type: ArgType.Number}, {type: ArgType.Message}],
            {type: ArgType.Message}
        ],
        run: run,
        userPermissions: UserPermissions.Moderator
    }
);
